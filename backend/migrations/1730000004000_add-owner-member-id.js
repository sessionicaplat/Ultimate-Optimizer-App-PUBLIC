/**
 * Migration: Add owner_member_id to app_instances
 *
 * Stores the Wix Site Member ID for the site owner, which is required when
 * creating blog posts on behalf of the merchant.
 */

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'owner_member_id'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN owner_member_id varchar(255);
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
          AND indexname = 'app_instances_owner_member_id_index'
      ) THEN
        CREATE INDEX app_instances_owner_member_id_index
          ON app_instances(owner_member_id);
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
          AND indexname = 'app_instances_owner_member_id_index'
      ) THEN
        DROP INDEX app_instances_owner_member_id_index;
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
          AND column_name = 'owner_member_id'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN owner_member_id;
      END IF;
    END
    $$;
  `);
};
