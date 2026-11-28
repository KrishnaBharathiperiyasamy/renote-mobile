const { Client } = require('D:/auth-service/node_modules/pg');

async function checkCounts() {
  const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/auth_service' });
  await client.connect();

  const tables = [
    'User',
    'RefreshToken',
    'UserAppAccess',
    'UserOtp',
    'AuthLog',
    'UserAppProfile',
    'AuthServiceAdmin',
    'AuthServiceAdminRefreshToken',
    'App',
    'AppRole'
  ];

  console.log("Current row counts in auth_service:");
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT count(*) FROM "${t}";`);
      console.log(`- ${t}: ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`- ${t}: error (${e.message})`);
    }
  }

  const users = await client.query(`SELECT * FROM "User";`);
  console.log("\nUsers in detail:", JSON.stringify(users.rows, null, 2));

  await client.end();
}

checkCounts();
