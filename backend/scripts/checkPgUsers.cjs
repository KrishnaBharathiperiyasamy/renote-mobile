const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/auth_service' });

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, email, phone, "firstName", "lastName", password FROM "User";');
    console.log('PostgreSQL Users in auth_service:');
    res.rows.forEach(r => {
      console.log(`- Name: ${r.firstName} ${r.lastName} | Phone: ${r.phone} | Email: ${r.email} | Hash: ${r.password?.substring(0, 20)}...`);
    });
    await client.end();
  } catch (err) {
    console.error('PG error:', err.message);
  }
}

run();
