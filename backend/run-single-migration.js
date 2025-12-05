#!/usr/bin/env node

/**
 * Run a single migration file
 * Usage: node run-single-migration.js <migration-file-name>
 */

const path = require('path');
const { Client } = require('pg');

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-single-migration.js <migration-file-name>');
  console.error('Example: node run-single-migration.js 1730000000001_add-published-column.js');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Load the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    console.log(`📄 Loading migration: ${migrationPath}`);
    
    const migration = require(migrationPath);

    // Create a simple pgm object with basic SQL execution
    const pgm = {
      addColumn: async (table, columns) => {
        for (const [columnName, columnDef] of Object.entries(columns)) {
          let sql = `ALTER TABLE ${table} ADD COLUMN ${columnName} ${columnDef.type}`;
          if (columnDef.notNull) sql += ' NOT NULL';
          if (columnDef.default !== undefined) {
            if (typeof columnDef.default === 'boolean') {
              sql += ` DEFAULT ${columnDef.default}`;
            } else {
              sql += ` DEFAULT '${columnDef.default}'`;
            }
          }
          console.log(`  Running: ${sql}`);
          await client.query(sql);
        }
      },
      createIndex: async (table, columns, options = {}) => {
        const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
        const indexName = options.name || `idx_${table}_${columnList.replace(/,\s*/g, '_')}`;
        const sql = `CREATE INDEX ${indexName} ON ${table} (${columnList})`;
        console.log(`  Running: ${sql}`);
        await client.query(sql);
      },
      sql: async (query) => {
        console.log(`  Running: ${query}`);
        await client.query(query);
      }
    };

    // Run the migration
    console.log('🚀 Running migration UP...');
    await migration.up(pgm);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
