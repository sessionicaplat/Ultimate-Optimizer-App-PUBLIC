/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Update free plan to 200 credits
  pgm.sql(`
    UPDATE plans 
    SET monthly_credits = 200 
    WHERE id = 'free';
  `);

  // Update existing free plan users to have 200 credits
  // This preserves their used credits and just increases the total
  pgm.sql(`
    UPDATE app_instances 
    SET credits_total = 200,
        updated_at = now()
    WHERE plan_id = 'free' 
      AND credits_total < 200;
  `);
};

exports.down = (pgm) => {
  // Revert free plan back to 100 credits
  pgm.sql(`
    UPDATE plans 
    SET monthly_credits = 100 
    WHERE id = 'free';
  `);

  pgm.sql(`
    UPDATE app_instances 
    SET credits_total = 100,
        updated_at = now()
    WHERE plan_id = 'free' 
      AND credits_total > 100;
  `);
};
