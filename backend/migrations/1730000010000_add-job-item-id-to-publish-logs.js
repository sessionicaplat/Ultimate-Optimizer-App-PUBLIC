exports.up = (pgm) => {
  pgm.addColumn('publish_logs', {
    job_item_id: {
      type: 'bigint',
      references: 'job_items(id)',
      onDelete: 'CASCADE',
      comment: 'Job item responsible for this publish action',
    },
  });

  pgm.addConstraint(
    'publish_logs',
    'publish_logs_job_item_id_unique',
    'UNIQUE(job_item_id)'
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('publish_logs', 'publish_logs_job_item_id_unique');
  pgm.dropColumn('publish_logs', 'job_item_id');
};
