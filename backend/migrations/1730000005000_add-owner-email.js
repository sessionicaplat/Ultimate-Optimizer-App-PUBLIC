/**
 * Migration: Ensure owner_email column exists on app_instances
 */

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'owner_email'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN owner_email varchar(255);
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
          AND indexname = 'app_instances_owner_email_index'
      ) THEN
        CREATE INDEX app_instances_owner_email_index
          ON app_instances(owner_email);
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
          AND indexname = 'app_instances_owner_email_index'
      ) THEN
        DROP INDEX app_instances_owner_email_index;
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
          AND column_name = 'owner_email'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN owner_email;
      END IF;
    END
    $$;
  `);
};
