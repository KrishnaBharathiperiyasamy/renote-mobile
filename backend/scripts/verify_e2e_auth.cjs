const axios = require('axios');
const bcrypt = require('c:/auth-service/node_modules/bcryptjs');
const mongoose = require('mongoose');
const { createPrismaClient } = require('C:/auth-service/dist/src/prisma/client.js');

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/auth_service';
const prisma = createPrismaClient();

async function runEndToEndVerification() {
  console.log("=================================================");
  console.log("   RENOTE END-TO-END REGISTRATION & AUTH TEST    ");
  console.log("=================================================\n");

  const testPhone = "9" + Math.floor(100000000 + Math.random() * 900000000);
  const testEmail = `renote_e2e_${Date.now()}@testreno.com`;
  const rawPassword = "Strong_Pass.2026";
  const firstName = "Aarav";
  const lastName = "Patel";

  // STEP 1: Registration API Call
  console.log("[TEST 1] Registering brand new user:");
  console.log(`- Phone: ${testPhone}`);
  console.log(`- Email: ${testEmail}`);
  console.log(`- Password: ${rawPassword}`);
  console.log(`- App: RENOTE, Role: USER`);

  let regData;
  try {
    const regRes = await axios.post("http://localhost:3004/auth/register", {
      firstName,
      lastName,
      phone: testPhone,
      email: testEmail,
      password: rawPassword,
      appCode: "RENOTE",
      roleCode: "USER"
    });
    console.log(">>> Status 201 Created! Message:", regRes.data.message);
    regData = regRes.data.data;
  } catch (err) {
    console.error(">>> Registration FAILED:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }

  const { accessToken, user } = regData;
  const authId = user.id;

  // STEP 2: Database Persistence & Password Hashing in PostgreSQL
  console.log("\n[TEST 2] Verifying PostgreSQL persistence & bcrypt password hash:");
  const pgUser = await prisma.user.findUnique({
    where: { id: authId },
    include: {
      userAppAccesses: {
        include: { app: true, appRole: true }
      }
    }
  });

  if (!pgUser) {
    console.error(">>> FAIL: User not found in PostgreSQL!");
    process.exit(1);
  }
  console.log(">>> Found in PostgreSQL User table: ID =", pgUser.id);
  console.log(">>> Stored Hash:", pgUser.passwordHash);

  const hashValid = await bcrypt.compare(rawPassword, pgUser.passwordHash);
  if (!hashValid) {
    console.error(">>> FAIL: Password hash does not match plaintext password!");
    process.exit(1);
  }
  console.log(">>> Bcrypt hash verified successfully! (Password matches)");

  const access = pgUser.userAppAccesses.find(a => a.app.code === "RENOTE");
  if (!access || access.appRole.code !== "USER") {
    console.error(">>> FAIL: App access or role USER missing in PostgreSQL!");
    process.exit(1);
  }
  console.log(">>> Verified App Access: App =", access.app.name, "| Role =", access.appRole.name);

  // STEP 3: MongoDB User Persistence via Backend API
  console.log("\n[TEST 3] Calling Backend /api/users/create-user to persist in MongoDB:");
  let mongoUserId;
  try {
    const beRes = await axios.post(
      "http://localhost:6003/api/users/create-user",
      {
        authId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phone
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log(">>> Backend responded:", beRes.status, beRes.data);
    mongoUserId = beRes.data.user_id;
  } catch (err) {
    console.error(">>> Backend create-user FAILED:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }

  await mongoose.connect("mongodb://localhost:27017/Renote_DB");
  const mongoDoc = await mongoose.connection.collection("users").findOne({ authId });
  if (!mongoDoc) {
    console.error(">>> FAIL: User record not found in MongoDB Renote_DB.users!");
    process.exit(1);
  }
  console.log(">>> Found in MongoDB Renote_DB.users:", {
    _id: mongoDoc._id,
    authId: mongoDoc.authId,
    phoneNumber: mongoDoc.phoneNumber,
    email: mongoDoc.email,
    firstName: mongoDoc.firstName,
    lastName: mongoDoc.lastName
  });
  await mongoose.disconnect();

  // STEP 4: Login with Phone & Password
  console.log("\n[TEST 4] Testing Login with newly created Phone Number:");
  try {
    const loginPhoneRes = await axios.post("http://localhost:3004/auth/login", {
      emailOrPhone: testPhone,
      password: rawPassword,
      appCode: "RENOTE"
    });
    console.log(">>> Status:", loginPhoneRes.status, "| Logged in as:", loginPhoneRes.data?.data?.user?.fullName || loginPhoneRes.data?.data?.user?.firstName);
  } catch (err) {
    console.error(">>> Phone login FAILED:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }

  // STEP 5: Login with Email & Password
  console.log("\n[TEST 5] Testing Login with newly created Email Address:");
  try {
    const loginEmailRes = await axios.post("http://localhost:3004/auth/login", {
      emailOrPhone: testEmail,
      password: rawPassword,
      appCode: "RENOTE"
    });
    console.log(">>> Status:", loginEmailRes.status, "| Logged in as:", loginEmailRes.data?.data?.user?.fullName || loginEmailRes.data?.data?.user?.firstName);
  } catch (err) {
    console.error(">>> Email login FAILED:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }

  // STEP 6: Duplicate Registration Handling
  console.log("\n[TEST 6] Testing Duplicate Registration Handling (Expected 409 Conflict):");
  try {
    await axios.post("http://localhost:3004/auth/register", {
      firstName: "Duplicate",
      lastName: "Attempt",
      phone: testPhone,
      email: testEmail,
      password: rawPassword,
      appCode: "RENOTE",
      roleCode: "USER"
    });
    console.error(">>> FAIL: Duplicate registration succeeded when it should have failed!");
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(">>> PASSED: 409 Conflict returned with message:", err.response.data.message);
    } else {
      console.error(">>> Unexpected status:", err.response?.status, err.response?.data);
      process.exit(1);
    }
  }

  console.log("\n=================================================");
  console.log("   ALL END-TO-END VERIFICATION CHECKS PASSED!    ");
  console.log("=================================================");
}

runEndToEndVerification().finally(() => prisma.$disconnect());
