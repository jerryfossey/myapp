-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "scheduledFor" DATE;

-- CreateIndex
CREATE INDEX "FollowUp_status_scheduledFor_idx" ON "FollowUp"("status", "scheduledFor");
