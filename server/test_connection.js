require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  console.log('Connecting to:', process.env.DB_HOST, '/', process.env.DB_NAME);
  try {
    const conn = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log('✓ Connected');

    const [rows] = await conn.query('SELECT id, heading1, journey_btn_text, journey_pdf_url FROM home_about LIMIT 1');
    console.log('home_about row:', JSON.stringify(rows[0], null, 2));

    const [cols] = await conn.query("SHOW COLUMNS FROM home_about LIKE 'journey%'");
    console.log('journey_* columns:', cols.map(c => c.Field));

    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('✗ Error:', e.message);
    process.exit(1);
  }
}

test();
