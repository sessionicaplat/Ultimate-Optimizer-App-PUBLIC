/**
 * Migration: add site_id column + supporting index on app_instances
 */

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'site_id'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN site_id varchar(255);
      END IF;
    END
    $$;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'app_instances'
          AND indexname = 'app_instances_site_id_index'
      ) THEN
        CREATE INDEX app_instances_site_id_index
          ON app_instances(site_id);
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
        FROM pg_indexes
        WHERE tablename = 'app_instances'
          AND indexname = 'app_instances_site_id_index'
      ) THEN
        DROP INDEX app_instances_site_id_index;
      END IF;
    END
    $$;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'site_id'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN site_id;
      END IF;
    END
    $$;
  `);
};
