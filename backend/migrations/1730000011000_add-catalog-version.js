/**
 * Migration: add catalog_version column to app_instances
 * Stores which Wix Stores Catalog version the site uses: 'V1' or 'V3'
 */

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'catalog_version'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN catalog_version text;
        
        COMMENT ON COLUMN app_instances.catalog_version IS 'Wix Stores Catalog version: V1 or V3';
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'catalog_version'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN catalog_version;
      END IF;
    END
    $$;
  `);
};
