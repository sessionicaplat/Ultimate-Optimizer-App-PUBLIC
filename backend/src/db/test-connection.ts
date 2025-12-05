/**
 * Simple script to test database connection
 * Run with: npx tsx src/db/test-connection.ts
 */

import { config } from 'dotenv';
import { query, closePool } from './index';

// Load environment variables
config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // Test basic query
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✓ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].pg_version);

    // Check if migrations table exists
    const migrationCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pgmigrations'
      ) as migrations_exist
    `);
    
    if (migrationCheck.rows[0].migrations_exist) {
      console.log('✓ Migrations table exists');
      
      // Check applied migrations
      const migrations = await query('SELECT * FROM pgmigrations ORDER BY id');
      console.log(`✓ Applied migrations: ${migrations.rowCount}`);
      migrations.rows.forEach(m => {
        console.log(`  - ${m.name} (run at: ${m.run_on})`);
      });
    } else {
      console.log('⚠ Migrations table does not exist. Run: npm run migrate');
    }

    // Check if our tables exist
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('plans', 'app_instances', 'jobs', 'job_items', 'publish_logs')
      ORDER BY table_name
    `);
    
    if (tables.rowCount && tables.rowCount > 0) {
      console.log('✓ Application tables found:');
      tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
      
      // Check plans seed data
      const plans = await query('SELECT id, name, monthly_credits FROM plans ORDER BY monthly_credits');
      console.log('✓ Plans seeded:');
      plans.rows.forEach(p => {
        console.log(`  - ${p.name} (${p.id}): ${p.monthly_credits} credits/month`);
      });
    } else {
      console.log('⚠ Application tables not found. Run: npm run migrate');
    }

  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  } finally {
    await closePool();
    console.log('\nConnection closed.');
  }
}

testConnection();
