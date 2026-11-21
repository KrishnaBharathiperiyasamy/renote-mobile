const { Client } = require('c:/Users/sri/Documents/auth_serv/node_modules/pg');

async function test() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:3004/auth_service' });
  await client.connect();
  const res = await client.query('SELECT id, email, phone, "firstName", "lastName" FROM "User" LIMIT 10;');
  console.log('PostgreSQL Users:', res.rows);
  const apps = await client.query('SELECT id, name, code FROM "App";');
  console.log('PostgreSQL Apps:', apps.rows);
  const roles = await client.query('SELECT * FROM "AppRole";');
  console.log('PostgreSQL App Roles:', roles.rows);
  await client.end();
}

test().catch(console.error);

