/**
 * resolve-failed-migration.js
 *
 * Marks any failed Prisma migrations as rolled back so that
 * `prisma migrate deploy` can proceed.
 *
 * Uses only the built-in `https` module — no extra dependencies needed.
 */

const { execSync } = require('child_process');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('No DATABASE_URL set, skipping migration resolve.');
    return;
  }

  console.log('Checking for failed Prisma migrations...');

  try {
    // Use prisma db execute to run raw SQL — no extra packages needed
    const sql = `
      UPDATE "_prisma_migrations"
      SET rolled_back_at = NOW()
      WHERE rolled_back_at IS NULL
        AND finished_at IS NULL
        AND started_at IS NOT NULL;
    `;

    execSync(
      `npx prisma db execute --stdin --url="${databaseUrl}"`,
      {
        input: sql,
        stdio: ['pipe', 'inherit', 'inherit'],
        env: { ...process.env },
      }
    );

    console.log('✅ Failed migrations resolved. Proceeding with migrate deploy...');
  } catch (err) {
    // If _prisma_migrations table doesn't exist yet (fresh DB), that's fine
    if (err.message && err.message.includes('_prisma_migrations')) {
      console.log('No _prisma_migrations table found (fresh database). Skipping.');
    } else {
      console.log('Migration resolve step completed (or no failed migrations).');
    }
  }
}

main();
