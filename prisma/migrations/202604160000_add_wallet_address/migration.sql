-- CreateEnum
-- (no new enums)

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

-- Create unique index if not exists (but note: the model has @unique, so we should add it)
-- However, we must be cautious because there might be existing NULL values.
-- We'll add a unique index that allows multiple NULLs (PostgreSQL's unique index allows multiple NULLs by default).
-- But the Prisma @unique on a nullable field would allow multiple NULLs? Actually, in Prisma, a @unique on a nullable field means that the field must be unique among non-null values, and multiple nulls are allowed.
-- So we create a unique index that ignores NULLs? Actually, the default unique index in PostgreSQL already allows multiple NULLs.
-- So we can just create a unique index on walletAddress, and it will allow multiple NULLs.

CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "public"."User"("walletAddress") WHERE "walletAddress" IS NOT NULL;

-- Note: The above index is conditional and only enforces uniqueness on non-null values.
-- However, the standard unique index in PostgreSQL already treats multiple NULLs as distinct, so we can also do:
-- CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "public"."User"("walletAddress");
-- But note: if there are duplicate NULLs, that's allowed. However, the above conditional index is more explicit and might be clearer.

-- However, let's check: the Prisma schema has `@unique` on a nullable field. The generated migration for Prisma would be:
--   CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
-- And that's what we should use because Prisma's unique index on a nullable field in PostgreSQL does allow multiple NULLs (because NULL != NULL in SQL, so the unique constraint considers them distinct).
-- But wait: the SQL standard says that NULL is not equal to anything, including NULL, so a unique index allows multiple NULLs.
-- So we can simply do:

-- DROP INDEX IF EXISTS "User_walletAddress_key"; -- in case we want to recreate
-- CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- However, to be safe and not break if the index already exists, we do:

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'User_walletAddress_key') THEN
      CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");
   END IF;
END $$;

-- But note: the above PL/pgSQL block is not necessary if we are sure the migration runs only once.
-- Since we are creating a new migration file, we can assume the index doesn't exist.

-- However, let's keep it simple and just create the index. If it fails because it already exists, we'll see in the logs and can adjust.

-- We'll go with the simple version and handle errors if they occur.

CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "public"."User"("walletAddress");
