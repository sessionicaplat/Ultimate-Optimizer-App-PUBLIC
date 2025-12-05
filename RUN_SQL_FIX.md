# Run SQL Fix for Image URLs

## Option 1: Using psql (Command Line)

If you have PostgreSQL installed locally:

```bash
psql "postgresql://ultimateaiapp_user:l2SLYgkngZlDs9xOweO3jKQW2hTGIGpg@dpg-d41ob549c44c73a1k5t0-a.oregon-postgres.render.com/ultimateaiapp" -c "UPDATE image_optimization_items SET optimized_image_url = TRIM(BOTH '\"' FROM TRIM(BOTH '''' FROM optimized_image_url)) WHERE optimized_image_url IS NOT NULL AND (optimized_image_url LIKE '\"%\"' OR optimized_image_url LIKE '''%''');"
```

## Option 2: Using Node.js Script

Run this from your project directory:

```bash
cd backend
DATABASE_URL="postgresql://ultimateaiapp_user:l2SLYgkngZlDs9xOweO3jKQW2hTGIGpg@dpg-d41ob549c44c73a1k5t0-a.oregon-postgres.render.com/ultimateaiapp" node fix-image-optimization-urls.js
```

## Option 3: Using a Database GUI Tool

1. **Download a PostgreSQL client** like:
   - [pgAdmin](https://www.pgadmin.org/)
   - [DBeaver](https://dbeaver.io/)
   - [TablePlus](https://tableplus.com/)

2. **Connect using these credentials:**
   - Host: `dpg-d41ob549c44c73a1k5t0-a.oregon-postgres.render.com`
   - Port: `5432`
   - Database: `ultimateaiapp`
   - Username: `ultimateaiapp_user`
   - Password: `l2SLYgkngZlDs9xOweO3jKQW2hTGIGpg`
   - SSL: Required

3. **Run this SQL:**
```sql
UPDATE image_optimization_items
SET optimized_image_url = TRIM(BOTH '"' FROM TRIM(BOTH '''' FROM optimized_image_url))
WHERE optimized_image_url IS NOT NULL
  AND (optimized_image_url LIKE '"%"' OR optimized_image_url LIKE '''%''');
```

## Option 4: Just Create a New Job

The easiest option - just create a new image optimization job. It will work perfectly with the fixed code!

## Verify the Fix

After running the SQL, check one of the URLs:

```sql
SELECT id, optimized_image_url 
FROM image_optimization_items 
WHERE optimized_image_url IS NOT NULL 
LIMIT 3;
```

The URLs should NOT have quotes around them.

---

**Security Note:** I've included your database credentials here for convenience, but you should:
1. Delete this file after using it
2. Consider rotating your database password
3. Never commit database credentials to Git
