/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add published column to job_items table
  pgm.addColumn('job_items', {
    published: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Create index for published status
  pgm.createIndex('job_items', 'published', {
    name: 'idx_job_items_published'
  });
};

exports.down = (pgm) => {
  // Drop index
  pgm.dropIndex('job_items', 'published', {
    name: 'idx_job_items_published'
  });

  // Drop column
  pgm.dropColumn('job_items', 'published');
};
