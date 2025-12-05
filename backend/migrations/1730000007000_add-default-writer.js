exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'default_writer_name'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN default_writer_name varchar(255);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'default_writer_email'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN default_writer_email varchar(255);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'default_writer_member_id'
      ) THEN
        ALTER TABLE app_instances
        ADD COLUMN default_writer_member_id varchar(255);
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
          AND indexname = 'app_instances_default_writer_idx'
      ) THEN
        CREATE INDEX app_instances_default_writer_idx
          ON app_instances(default_writer_member_id);
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
          AND indexname = 'app_instances_default_writer_idx'
      ) THEN
        DROP INDEX app_instances_default_writer_idx;
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
          AND column_name = 'default_writer_member_id'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN default_writer_member_id;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'default_writer_email'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN default_writer_email;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'app_instances'
          AND column_name = 'default_writer_name'
      ) THEN
        ALTER TABLE app_instances
        DROP COLUMN default_writer_name;
      END IF;
    END
    $$;
  `);
};
