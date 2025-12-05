#!/usr/bin/env node

/**
 * Custom migration runner with SSL support for Render PostgreSQL
 */

const { spawn } = require('child_process');

// Modify DATABASE_URL to include SSL parameter
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Add sslmode=require to the connection string if not already present
let modifiedUrl = databaseUrl;
if (!databaseUrl.includes('sslmode=') && !databaseUrl.includes('ssl=')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  modifiedUrl = `${databaseUrl}${separator}sslmode=require`;
}

console.log('Running migrations with SSL enabled...');

// Set the modified URL and run node-pg-migrate
const env = {
  ...process.env,
  DATABASE_URL: modifiedUrl,
  PGSSLMODE: 'require'
};

const migrate = spawn('node-pg-migrate', ['up'], {
  env,
  stdio: 'inherit',
  shell: true
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error(`Migration process exited with code ${code}`);
    process.exit(code);
  }
  console.log('✓ Migrations completed successfully');
  process.exit(0);
});

migrate.on('error', (err) => {
  console.error('Failed to start migration process:', err);
  process.exit(1);
});
