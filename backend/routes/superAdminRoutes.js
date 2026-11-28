import express from 'express';
import jwt from 'jsonwebtoken';
import { TOTP } from 'otpauth';
import multer from 'multer';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import superAdminAuth from '../middleware/superAdminAuth.js';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import {
  getAllCompanies,
  blockCompany,
  unblockCompany,
  deleteCompany,
  editCompany,
  resetOwnerPassword,
} from '../controllers/superAdminCompanyController.js';
import {
  getAllUsers,
  listUserBackups,
  deleteUser,
  blockUser,
  unblockUser,
  resetUserPassword,
  restoreUserBackup,
  downloadUserBackup,
  deleteUserBackup,
} from '../controllers/superAdminUserController.js';
import {
  getStats,
  getMaintenanceStatus,
  toggleMaintenance,
  createBackup,
  restoreBackup,
} from '../controllers/superAdminSystemController.js';
import {
  getAllSubscriptions,
  getAllPayments,
  getSubscriptionStats,
  modifyUserSubscription,
  grantProTrial,
} from '../controllers/superAdminSubscriptionController.js';

dotenv.config();
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

const SA_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'Vyshwa';
const SA_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SA_ROLE = process.env.SUPER_ADMIN_ROLE || 'SUPER_ADMIN';
const TOTP_SECRET = process.env.TOTP_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// ──── Auth Routes (no middleware) ────

// Step 1: Verify username + password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

    // Look up the single Super Admin user from MongoDB
    const saUser = await User.findOne({
      $or: [
        { role: SA_ROLE },
        { username: SA_USERNAME },
        { authId: 'super-admin-root' },
      ],
      isDeleted: false,
    }).select('+password');

    // Verify username
    const validUsername = (username === SA_USERNAME) || (saUser && saUser.username === username);
    if (!validUsername) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password: check against hashed password in MongoDB (or env fallback)
    let passwordMatches = false;
    if (saUser && saUser.password) {
      passwordMatches = await bcrypt.compare(password, saUser.password);
    } else if (SA_PASSWORD) {
      passwordMatches = (password === SA_PASSWORD);
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Password OK — require TOTP next
    // Issue a short-lived pre-auth token (5 min) for TOTP step
    const preToken = jwt.sign(
      { step: 'totp-pending', username },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ requireTotp: true, preToken });
  } catch (error) {
    console.error('Super Admin login error:', error.message);
    res.status(500).json({ message: 'Authentication error' });
  }
});

// Step 2: Verify TOTP code
router.post('/verify-totp', (req, res) => {
  const { code, preToken } = req.body;

  if (!code || !preToken)
    return res.status(400).json({ message: 'TOTP code and preToken are required' });

  // Verify pre-auth token
  let decoded;
  try {
    decoded = jwt.verify(preToken, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Pre-auth token expired or invalid. Login again.' });
  }

  if (decoded.step !== 'totp-pending')
    return res.status(401).json({ message: 'Invalid pre-auth token' });

  // Verify TOTP
  const totp = new TOTP({
    issuer: 'reNote',
    label: SA_USERNAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: TOTP_SECRET,
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null)
    return res.status(401).json({ message: 'Invalid TOTP code' });

  // Issue full SA JWT (24h)
  const accessToken = jwt.sign(
    { role: SA_ROLE, legacyRole: 'super-admin', username: decoded.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ access_token: accessToken });
});

// TOTP setup — returns URI for QR code scan (dev/first-time use)
router.get('/totp-setup', (req, res) => {
  const totp = new TOTP({
    issuer: 'reNote',
    label: SA_USERNAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: TOTP_SECRET,
  });
  res.json({ uri: totp.toString() });
});

// ──── Protected Routes ────

// Verify TOTP for sensitive actions (already authenticated, just re-verify TOTP)
router.post('/verify-action-totp', superAdminAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'TOTP code is required' });

  const totp = new TOTP({
    issuer: 'reNote',
    label: SA_USERNAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: TOTP_SECRET,
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) return res.status(401).json({ message: 'Invalid TOTP code' });

  res.json({ verified: true });
});

// Stats
router.get('/stats', superAdminAuth, getStats);

// Companies
router.get('/companies', superAdminAuth, getAllCompanies);
router.put('/companies/:id', superAdminAuth, editCompany);
router.put('/companies/:id/block', superAdminAuth, blockCompany);
router.put('/companies/:id/unblock', superAdminAuth, unblockCompany);
router.post('/companies/:id/reset-password', superAdminAuth, resetOwnerPassword);
router.delete('/companies/:id', superAdminAuth, deleteCompany);

// Users
router.get('/users', superAdminAuth, getAllUsers);
router.get('/users/backups', superAdminAuth, listUserBackups);
router.get('/users/backups/:backupId/download', superAdminAuth, downloadUserBackup);
router.delete('/users/backups/:backupId', superAdminAuth, deleteUserBackup);
router.post('/users/restore/:backupId', superAdminAuth, restoreUserBackup);
router.put('/users/:id/block', superAdminAuth, blockUser);
router.put('/users/:id/unblock', superAdminAuth, unblockUser);
router.post('/users/:id/reset-password', superAdminAuth, resetUserPassword);
router.delete('/users/:id', superAdminAuth, deleteUser);

// Grant Free Pro Trial (subscription feature, commented out)
// router.post('/users/:id/grant-trial', superAdminAuth, grantProTrial);

// Maintenance
router.get('/maintenance', superAdminAuth, getMaintenanceStatus);
router.post('/maintenance', superAdminAuth, toggleMaintenance);

// Backup & Restore
router.post('/backup', superAdminAuth, createBackup);
router.post('/restore', superAdminAuth, upload.single('backup'), restoreBackup);

// Subscriptions & Payments
router.get('/subscriptions', superAdminAuth, getAllSubscriptions);
router.get('/payments', superAdminAuth, getAllPayments);
router.get('/subscription-stats', superAdminAuth, getSubscriptionStats);
router.put('/subscriptions/user/:userId', superAdminAuth, modifyUserSubscription);
router.post('/users/:id/grant-trial', superAdminAuth, grantProTrial);

// GST Options
router.put('/gst-options', superAdminAuth, async (req, res) => {
  try {
    const { gstOptions } = req.body;
    if (!Array.isArray(gstOptions) || !gstOptions.every(v => typeof v === 'number' && v >= 0 && v <= 100)) {
      return res.status(400).json({ message: "gstOptions must be an array of numbers between 0-100" });
    }
    const sorted = [...new Set(gstOptions)].sort((a, b) => a - b);
    const setting = await SystemSetting.findOneAndUpdate(
      { key: "gst_options" },
      { value: sorted },
      { upsert: true, new: true }
    );
    res.json({ message: "GST options updated", gstOptions: setting.value });
  } catch (error) {
    res.status(500).json({ message: "Error updating GST options" });
  }
});

export default router;
