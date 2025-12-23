-- Step 1: Delete all users with VIEWER role
DELETE FROM users WHERE role = 'VIEWER';

-- Step 2: Update existing users with MEDICAL_REVIEWER to MEDICAL_AFFAIRS
UPDATE users SET role = 'MEDICAL_AFFAIRS' WHERE role = 'MEDICAL_REVIEWER';

-- Step 3: Update existing users with DOCTOR_CREATOR to DOCTOR
UPDATE users SET role = 'DOCTOR' WHERE role = 'DOCTOR_CREATOR';

-- Step 4: Create a new enum type with the updated values
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'MEDICAL_AFFAIRS', 'BRAND_REVIEWER', 'DOCTOR', 'AGENCY_POC', 'CONTENT_APPROVER', 'PUBLISHER');

-- Step 5: Alter the users table to use the new enum type
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING "role"::text::"UserRole_new";

-- Step 6: Update script_reviews table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'script_reviews' AND column_name = 'reviewer_type') THEN
    ALTER TABLE "script_reviews" ALTER COLUMN "reviewer_type" TYPE "UserRole_new" USING "reviewer_type"::text::"UserRole_new";
  END IF;
END $$;

-- Step 7: Update video_reviews table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_reviews' AND column_name = 'reviewer_type') THEN
    ALTER TABLE "video_reviews" ALTER COLUMN "reviewer_type" TYPE "UserRole_new" USING "reviewer_type"::text::"UserRole_new";
  END IF;
END $$;

-- Step 8: Drop the old enum type
DROP TYPE "UserRole";

-- Step 9: Rename the new enum type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

