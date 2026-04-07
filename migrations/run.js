const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
  });

  const migrationsDir = path.join(__dirname);
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${sqlFiles.length} migration(s)...`);

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`  Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`  ✓ ${file} completed`);
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully.');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
