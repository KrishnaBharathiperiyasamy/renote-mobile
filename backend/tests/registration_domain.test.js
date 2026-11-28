import { describe, it } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import {
  APPROVED_EMAILS,
  UNAUTHORIZED_EMAIL_MESSAGE,
  isApprovedEmail,
} from '../config/approvedEmails.js';
import { createUser, updateUser } from '../controllers/userController.js';
import {
  loginSecure,
  forgotPasswordRequestOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordResetPassword,
} from '../controllers/authFlowController.js';
import { requestEmailOtp, verifyEmailOtp } from '../controllers/otpController.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

describe('ReNote Krishub Approved Emails Authentication Validation', () => {
  const EXPECTED_ERROR_MESSAGE =
    'Your email address is not authorized to access ReNote. Please contact your administrator.';

  const EXPECTED_15_EMAILS = [
    'muhamedashik@krishub.in',
    'bharanitharan@krishub.in',
    'yashikasri@krishub.in',
    'sanjay@krishub.in',
    'santhosh@krishub.in',
    'mothilalnehru@krishub.in',
    'suriya@krishub.in',
    'gowdham@krishub.in',
    'mukesh@krishub.in',
    'abinesh@krishub.in',
    'krishnabharathi@krishub.in',
    'moushami@krishub.in',
    'afshana@krishub.in',
    'nisha@krishub.in',
    'admin@krishub.in',
  ];

  function createMockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  }

  describe('1. Centralized Approved Email List Configuration', () => {
    it('contains exactly the 15 authorized email addresses', () => {
      assert.strictEqual(APPROVED_EMAILS.length, 15);
      for (const email of EXPECTED_15_EMAILS) {
        assert.ok(
          APPROVED_EMAILS.includes(email),
          `Expected APPROVED_EMAILS to contain ${email}`
        );
      }
    });

    it('matches the exact expected unauthorized error message', () => {
      assert.strictEqual(
        UNAUTHORIZED_EMAIL_MESSAGE,
        'Your email address is not authorized to access ReNote. Please contact your administrator.'
      );
    });

    it('accepts all 15 approved emails in exact lowercase form', () => {
      for (const email of EXPECTED_15_EMAILS) {
        assert.strictEqual(
          isApprovedEmail(email),
          true,
          `Expected ${email} to be approved`
        );
      }
    });

    it('accepts uppercase, mixed-case, and padded whitespace variants of approved emails', () => {
      const variants = [
        'MUHAMEDASHIK@KRISHUB.IN',
        'Bharanitharan@krishub.in',
        '   yashikasri@krishub.in   ',
        '\tsanjay@krishub.in\n',
        'SANTHOSH@KRISHUB.IN',
        'MothilalNehru@Krishub.In',
        '  suriya@krishub.in',
        'gowdham@krishub.in  ',
        'MUKESH@krishub.in',
        'Abinesh@KRISHUB.IN',
        'KRISHNABHARATHI@krishub.in',
        '  moushami@krishub.in  ',
        'Afshana@krishub.in',
        'NISHA@KRISHUB.IN',
        '   Admin@Krishub.In   ',
      ];
      for (const variant of variants) {
        assert.strictEqual(
          isApprovedEmail(variant),
          true,
          `Expected variant "${variant}" to be approved`
        );
      }
    });

    it('blocks other @krishub.in email addresses not on the approved list', () => {
      const unauthorizedKrishubEmails = [
        'john@krishub.in',
        'vyshwa@krishub.in',
        'developer@krishub.in',
        'sales@krishub.in',
        'support@krishub.in',
        'info@krishub.in',
        'test@krishub.in',
        'superadmin@krishub.in',
        'pandi123@krishub.in',
        'first.last@krishub.in',
        'admin.support@krishub.in',
      ];
      for (const email of unauthorizedKrishubEmails) {
        assert.strictEqual(
          isApprovedEmail(email),
          false,
          `Expected other Krishub email "${email}" to be blocked`
        );
      }
    });

    it('blocks non-krishub domains and invalid formats', () => {
      const invalidEmails = [
        'user@gmail.com',
        'admin@yahoo.com',
        'admin@outlook.com',
        'krishub.in',
        '@krishub.in',
        'notanemail',
        '',
        null,
        undefined,
        12345,
        {},
      ];
      for (const email of invalidEmails) {
        assert.strictEqual(
          isApprovedEmail(email),
          false,
          `Expected "${email}" to be rejected`
        );
      }
    });
  });

  describe('2. Frontend Registration & Login Guard Parity', () => {
    function simulateFrontendEmailGuard(email) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
        return { valid: false, error: EXPECTED_ERROR_MESSAGE };
      }
      return { valid: true, error: null };
    }

    it('rejects unauthorized email with exact error message', () => {
      const res = simulateFrontendEmailGuard('stranger@krishub.in');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, EXPECTED_ERROR_MESSAGE);
    });

    it('rejects non-krishub email with exact error message', () => {
      const res = simulateFrontendEmailGuard('test@gmail.com');
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, EXPECTED_ERROR_MESSAGE);
    });

    it('allows valid approved email', () => {
      const res = simulateFrontendEmailGuard('suriya@krishub.in');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.error, null);
    });

    it('allows approved email with whitespace and mixed casing', () => {
      const res = simulateFrontendEmailGuard('   Admin@Krishub.In  ');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.error, null);
    });
  });

  describe('3. Actual Backend User Controller Guard (createUser & updateUser)', () => {
    it('createUser rejects registration if email is an unapproved @krishub.in address', async () => {
      const req = {
        body: {
          authId: 'auth_unapproved_1',
          email: 'random@krishub.in',
          phoneNumber: '9876543210',
          firstName: 'Random',
          lastName: 'User',
        },
      };
      const res = createMockRes();
      await createUser(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('createUser rejects registration if email is a foreign domain', async () => {
      const req = {
        body: {
          authId: 'auth_foreign_1',
          email: 'intruder@gmail.com',
          phoneNumber: '9876543210',
          firstName: 'Intruder',
          lastName: 'User',
        },
      };
      const res = createMockRes();
      await createUser(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('createUser rejects registration if email is missing or empty', async () => {
      const req = {
        body: {
          authId: 'auth_no_email',
          email: '',
          phoneNumber: '9876543210',
        },
      };
      const res = createMockRes();
      await createUser(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('createUser accepts registration with approved email (case-insensitive & whitespace padded)', async () => {
      const origFindOne = User.findOne;
      const origCreate = User.create;
      try {
        User.findOne = async () => null;
        let createdDoc = null;
        User.create = async (doc) => {
          createdDoc = doc;
          return { _id: 'mongo_mock_id_1', ...doc };
        };

        const req = {
          body: {
            authId: 'auth_muhamedashik',
            email: '  MuhamedAshik@krishub.in  ',
            phoneNumber: '9876543210',
            firstName: 'Muhamed',
            lastName: 'Ashik',
          },
        };
        const res = createMockRes();
        await createUser(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.jsonData?.message, 'User created successfully');
        assert.strictEqual(createdDoc.email, 'muhamedashik@krishub.in');
      } finally {
        User.findOne = origFindOne;
        User.create = origCreate;
      }
    });

    it('createUser allows existing user when existing user has approved email', async () => {
      const origFindOne = User.findOne;
      try {
        User.findOne = async () => ({
          _id: 'existing_mongo_id',
          authId: 'auth_admin_exists',
          email: 'admin@krishub.in',
        });

        const req = {
          body: {
            authId: 'auth_admin_exists',
            email: 'admin@krishub.in',
          },
        };
        const res = createMockRes();
        await createUser(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData?.exists, true);
        assert.strictEqual(res.jsonData?.message, 'User already exists');
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('createUser rejects if existing user in DB has unapproved email', async () => {
      const origFindOne = User.findOne;
      try {
        User.findOne = async () => ({
          _id: 'existing_bad_id',
          authId: 'auth_bad_exists',
          email: 'unapproved_in_db@krishub.in',
        });

        const req = {
          body: {
            authId: 'auth_bad_exists',
            email: 'admin@krishub.in',
          },
        };
        const res = createMockRes();
        await createUser(req, res);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('updateUser blocks changing email to an unapproved address', async () => {
      const origFindById = User.findById;
      const origFindOne = User.findOne;
      try {
        const testId = new mongoose.Types.ObjectId().toString();
        const mockUser = {
          _id: testId,
          email: 'admin@krishub.in',
          role: 'USER',
          save: async () => mockUser,
        };
        User.findById = async () => mockUser;
        User.findOne = async () => mockUser;

        const req = {
          params: { id: testId },
          body: { email: 'hacker@krishub.in' },
        };
        const res = createMockRes();
        await updateUser(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
      } finally {
        User.findById = origFindById;
        User.findOne = origFindOne;
      }
    });

    it('updateUser blocks clearing email to empty string', async () => {
      const origFindById = User.findById;
      const origFindOne = User.findOne;
      try {
        const testId = new mongoose.Types.ObjectId().toString();
        const mockUser = {
          _id: testId,
          email: 'admin@krishub.in',
          role: 'USER',
          save: async () => mockUser,
        };
        User.findById = async () => mockUser;
        User.findOne = async () => mockUser;

        const req = {
          params: { id: testId },
          body: { email: '   ' },
        };
        const res = createMockRes();
        await updateUser(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
      } finally {
        User.findById = origFindById;
        User.findOne = origFindOne;
      }
    });
  });

  describe('4. Actual Backend Login & Recovery Guards', () => {
    it('loginSecure rejects unapproved @krishub.in email login with 403 and exact message', async () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: {
          identifier: 'guest@krishub.in',
          password: 'Password123!',
        },
      };
      const res = createMockRes();
      await loginSecure(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('loginSecure rejects non-krishub email with 403 and exact message', async () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
        body: {
          identifier: 'user@yahoo.com',
          password: 'Password123!',
        },
      };
      const res = createMockRes();
      await loginSecure(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('loginSecure rejects phone login when user account in DB has no email', async () => {
      const origFindOne = User.findOne;
      try {
        User.findOne = async () => ({
          _id: 'user_no_email',
          phoneNumber: '9876543210',
          email: '',
          isDeleted: false,
        });

        const req = {
          headers: {},
          socket: { remoteAddress: '127.0.0.1' },
          body: {
            identifier: '9876543210',
            password: 'Password123!',
          },
        };
        const res = createMockRes();
        await loginSecure(req, res);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('loginSecure rejects phone login when user account in DB has unapproved email', async () => {
      const origFindOne = User.findOne;
      try {
        User.findOne = async () => ({
          _id: 'user_bad_email',
          phoneNumber: '9876543210',
          email: 'unapproved_user@krishub.in',
          isDeleted: false,
        });

        const req = {
          headers: {},
          socket: { remoteAddress: '127.0.0.1' },
          body: {
            identifier: '9876543210',
            password: 'Password123!',
          },
        };
        const res = createMockRes();
        await loginSecure(req, res);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
      } finally {
        User.findOne = origFindOne;
      }
    });

    it('forgotPasswordRequestOtp rejects unapproved email with 403 and exact message', async () => {
      const req = {
        body: {
          email: 'intruder@krishub.in',
          phoneNumber: '9876543210',
        },
      };
      const res = createMockRes();
      await forgotPasswordRequestOtp(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('forgotPasswordVerifyOtp rejects unapproved email with 403 and exact message', async () => {
      const req = {
        body: {
          email: 'unauthorized@krishub.in',
          phoneNumber: '9876543210',
          otp: '123456',
        },
      };
      const res = createMockRes();
      await forgotPasswordVerifyOtp(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('forgotPasswordResetPassword rejects unapproved email with 403 and exact message', async () => {
      const req = {
        body: {
          email: 'unauthorized@krishub.in',
          phoneNumber: '9876543210',
          resetToken: 'token123',
          newPassword: 'ValidPassword123!',
        },
      };
      const res = createMockRes();
      await forgotPasswordResetPassword(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });
  });

  describe('5. Actual Backend OTP Controller Guards', () => {
    it('requestEmailOtp rejects unapproved @krishub.in email with 400 and exact message', async () => {
      const req = { body: { email: 'spammer@krishub.in' } };
      const res = createMockRes();
      await requestEmailOtp(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('requestEmailOtp rejects non-krishub email with 400 and exact message', async () => {
      const req = { body: { email: 'external@hotmail.com' } };
      const res = createMockRes();
      await requestEmailOtp(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('verifyEmailOtp rejects unapproved email with 400 and exact message', async () => {
      const req = { body: { email: 'intruder@krishub.in', otp: '123456' } };
      const res = createMockRes();
      await verifyEmailOtp(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.jsonData?.message, EXPECTED_ERROR_MESSAGE);
    });

    it('verifyEmailOtp normalizes email and verifies valid OTP for approved email', async () => {
      const origFindOne = Otp.findOne;
      const origDeleteOne = Otp.deleteOne;
      try {
        let queriedEmail = null;
        let deletedEmail = null;
        Otp.findOne = async (query) => {
          queriedEmail = query.email;
          return {
            email: 'admin@krishub.in',
            otp: '654321',
            expiresAt: new Date(Date.now() + 60000),
          };
        };
        Otp.deleteOne = async (query) => {
          deletedEmail = query.email;
          return { acknowledged: true };
        };

        const req = {
          body: {
            email: '  Admin@Krishub.In  ',
            otp: '654321',
          },
        };
        const res = createMockRes();
        await verifyEmailOtp(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData?.message, 'OTP verified successfully!');
        assert.strictEqual(queriedEmail, 'admin@krishub.in');
        assert.strictEqual(deletedEmail, 'admin@krishub.in');
      } finally {
        Otp.findOne = origFindOne;
        Otp.deleteOne = origDeleteOne;
      }
    });
  });
});
