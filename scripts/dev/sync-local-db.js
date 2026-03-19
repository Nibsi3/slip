/**
 * Syncs the local PostgreSQL database with the current Prisma schema.
 * Run with: node scripts/sync-local-db.js
 * 
 * This is needed because `prisma db push` uses .env (Supabase) but the
 * dev server uses .env.local (local postgres).
 */
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
for (const line of lines) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.substring(0, eq).trim();
    const val = line.substring(eq + 1).trim().replace(/^"|"$/g, '');
    process.env[key] = val;
  }
}

console.log('Syncing local DB:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  // Run prisma db push equivalent via raw SQL for local DB
  // This handles all schema drift by applying missing columns/tables
  const { execSync } = require('child_process');
  
  // Temporarily write a .env with the local DB URL for prisma to use
  const tmpEnv = `DATABASE_URL="${process.env.DATABASE_URL}"\nDIRECT_URL="${process.env.DATABASE_URL}"`;
  fs.writeFileSync(path.join(__dirname, '..', '.env.push'), tmpEnv);
  
  try {
    execSync('npx prisma db push --skip-generate --schema=prisma/schema.prisma', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DATABASE_URL,
      },
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('\n✓ Local DB synced successfully');
  } finally {
    try { fs.unlinkSync(path.join(__dirname, '..', '.env.push')); } catch(e) {}
  }
}

main().catch(e => console.error('Error:', e.message)).finally(() => db.$disconnect());
