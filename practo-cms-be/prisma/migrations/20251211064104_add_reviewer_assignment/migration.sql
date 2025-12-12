-- AlterTable
ALTER TABLE "scripts" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "assigned_reviewer_id" TEXT;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "assigned_at" TIMESTAMP(3),
ADD COLUMN     "assigned_reviewer_id" TEXT;

-- CreateIndex
CREATE INDEX "scripts_assigned_reviewer_id_idx" ON "scripts"("assigned_reviewer_id");

-- CreateIndex
CREATE INDEX "videos_assigned_reviewer_id_idx" ON "videos"("assigned_reviewer_id");

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
