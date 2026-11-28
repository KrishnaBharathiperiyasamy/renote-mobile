const { Client } = require('D:/auth-service/node_modules/pg');

async function cleanAllAuthData() {
  console.log("==================================================");
  console.log("   CLEARING ALL BACKEND USER & LOGIN DATA         ");
  console.log("==================================================\n");

  const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/auth_service' });
  await client.connect();

  try {
    // 1. Check existing users before deletion
    const beforeUsers = await client.query('SELECT count(*) FROM "User";');
    console.log(`[BEFORE] Total Users in PostgreSQL: ${beforeUsers.rows[0].count}`);

    // 2. Clear all child tables & user records using CASCADE
    console.log("Removing all auth logs, tokens, OTPs, app profiles, and users...");
    await client.query('TRUNCATE TABLE "RefreshToken", "UserOtp", "AuthLog", "UserAppProfile", "UserAppAccess", "User" CASCADE;');

    // 3. Verify counts after deletion
    const afterUsers = await client.query('SELECT count(*) FROM "User";');
    const afterTokens = await client.query('SELECT count(*) FROM "RefreshToken";');
    const afterAccess = await client.query('SELECT count(*) FROM "UserAppAccess";');
    console.log(`[AFTER] Total Users in PostgreSQL: ${afterUsers.rows[0].count}`);
    console.log(`[AFTER] Total RefreshTokens: ${afterTokens.rows[0].count}`);
    console.log(`[AFTER] Total UserAppAccess: ${afterAccess.rows[0].count}`);

    // 4. Verify system apps and roles remain intact for new registrations
    const apps = await client.query('SELECT id, name, code FROM "App";');
    console.log("\n[SYSTEM] Intact Apps for Registration:", apps.rows);
    const roles = await client.query('SELECT id, name, code FROM "AppRole";');
    console.log("[SYSTEM] Intact Roles for Registration:", roles.rows.map(r => r.code));

    console.log("\n>>> SUCCESS: All backend user & login data wiped cleanly! Database is now a fresh clean slate.");
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    await client.end();
  }
}

cleanAllAuthData();
