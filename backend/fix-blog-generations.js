/**
 * Fix stuck blog generations
 * Run this to reset any stuck PENDING generations
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixBlogGenerations() {
  try {
    console.log('Checking blog generations...\n');

    // Check current state
    const result = await pool.query(`
      SELECT id, status, blog_ideas IS NOT NULL as has_ideas, 
             selected_idea_index, created_at
      FROM blog_generations
      ORDER BY id
    `);

    console.log('Current generations:');
    result.rows.forEach(row => {
      console.log(`  ID ${row.id}: status=${row.status}, has_ideas=${row.has_ideas}, selected=${row.selected_idea_index}, created=${row.created_at}`);
    });

    // Fix stuck PENDING generations that have ideas
    const fixResult = await pool.query(`
      UPDATE blog_generations
      SET status = 'AWAITING_SELECTION'
      WHERE status = 'PENDING' 
        AND blog_ideas IS NOT NULL
        AND selected_idea_index IS NULL
      RETURNING id
    `);

    if (fixResult.rowCount > 0) {
      console.log(`\n✅ Fixed ${fixResult.rowCount} stuck generation(s)`);
      fixResult.rows.forEach(row => {
        console.log(`   - Generation ${row.id} set to AWAITING_SELECTION`);
      });
    } else {
      console.log('\n✅ No stuck generations found');
    }

    // Show final state
    const finalResult = await pool.query(`
      SELECT id, status, blog_ideas IS NOT NULL as has_ideas
      FROM blog_generations
      WHERE status IN ('PENDING', 'AWAITING_SELECTION')
      ORDER BY id
    `);

    console.log('\nFinal state:');
    finalResult.rows.forEach(row => {
      console.log(`  ID ${row.id}: status=${row.status}, has_ideas=${row.has_ideas}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixBlogGenerations();
