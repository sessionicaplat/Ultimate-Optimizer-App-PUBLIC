/**
 * Placeholder migration to maintain migration history consistency
 * Production database already has this migration recorded.
 * This is a no-op to prevent migration ordering errors.
 */

exports.up = (pgm) => {
  // No-op migration - just maintains the migration history
  pgm.sql('SELECT 1;');
};

exports.down = (pgm) => {
  // No-op migration
  pgm.sql('SELECT 1;');
};
