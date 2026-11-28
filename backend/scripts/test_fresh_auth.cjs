const axios = require('d:/myreno/backend/node_modules/axios');
const { Client } = require('D:/auth-service/node_modules/pg');

async function testFreshRegistrationAndCleanup() {
  console.log("=== TESTING FRESH USER REGISTRATION ON CLEAN DATABASE ===");
  const testPhone = "9876543210";
  const testEmail = "freshuser@example.com";
  const testPassword = "MySecurePassword123";

  try {
    // 1. Register brand new user
    const regRes = await axios.post("http://localhost:3004/auth/register", {
      firstName: "Test",
      lastName: "User",
      phone: testPhone,
      email: testEmail,
      password: testPassword,
      appCode: "RENOTE",
      roleCode: "USER"
    });
    console.log(">>> [SUCCESS] Registration API Response:", regRes.status, regRes.data.message);
    const authData = regRes.data.data;
    console.log(">>> User ID created:", authData.user?.id);
    console.log(">>> Access Token generated:", !!authData.accessToken);

    // 2. Test Login with this fresh user
    const loginRes = await axios.post("http://localhost:3004/auth/login", {
      emailOrPhone: testPhone,
      password: testPassword,
      appCode: "RENOTE"
    });
    console.log(">>> [SUCCESS] Login API Response:", loginRes.status, "Welcome", loginRes.data?.data?.user?.fullName);

    // 3. Clean up the test user so the database is completely empty for the user
    console.log("\nCleaning up test user to leave database completely empty...");
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/auth_service' });
    await client.connect();
    await client.query('TRUNCATE TABLE "RefreshToken", "UserOtp", "AuthLog", "UserAppProfile", "UserAppAccess", "User" CASCADE;');
    const finalCount = await client.query('SELECT count(*) FROM "User";');
    console.log(`>>> Confirmed empty database. Current User Count: ${finalCount.rows[0].count}`);
    await client.end();

    console.log("\n=== ALL VERIFICATIONS PASSED: SYSTEM READY FOR NEW REGISTRATIONS ===");
  } catch (err) {
    console.error("Test failed:", err.response?.status, err.response?.data || err.message);
  }
}

testFreshRegistrationAndCleanup();
