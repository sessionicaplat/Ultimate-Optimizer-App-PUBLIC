/**
 * Fix image optimization URLs by removing surrounding quotes
 * Run this once to clean up existing data
 */

const { Pool } = require('pg');
require('dotenv').config();

async function fixImageOptimizationUrls() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    
    // Get all items with quoted URLs
    const selectResult = await pool.query(`
      SELECT id, optimized_image_url
      FROM image_optimization_items
      WHERE optimized_image_url IS NOT NULL
        AND (optimized_image_url LIKE '"%"' OR optimized_image_url LIKE '''%''')
    `);

    console.log(`Found ${selectResult.rows.length} items with quoted URLs`);

    if (selectResult.rows.length === 0) {
      console.log('No URLs to fix!');
      await pool.end();
      return;
    }

    // Show examples
    console.log('\nExamples of URLs to fix:');
    selectResult.rows.slice(0, 3).forEach(row => {
      console.log(`  ID ${row.id}: ${row.optimized_image_url.substring(0, 80)}...`);
    });

    // Fix the URLs
    console.log('\nFixing URLs...');
    const updateResult = await pool.query(`
      UPDATE image_optimization_items
      SET optimized_image_url = TRIM(BOTH '"' FROM TRIM(BOTH '''' FROM optimized_image_url))
      WHERE optimized_image_url IS NOT NULL
        AND (optimized_image_url LIKE '"%"' OR optimized_image_url LIKE '''%''')
    `);

    console.log(`✅ Fixed ${updateResult.rowCount} URLs`);

    // Verify the fix
    const verifyResult = await pool.query(`
      SELECT id, optimized_image_url
      FROM image_optimization_items
      WHERE id = ANY($1)
      LIMIT 3
    `, [selectResult.rows.slice(0, 3).map(r => r.id)]);

    console.log('\nVerification - URLs after fix:');
    verifyResult.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.optimized_image_url.substring(0, 80)}...`);
    });

    await pool.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixImageOptimizationUrls();
