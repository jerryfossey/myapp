-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "recurrenceInterval" INTEGER,
ADD COLUMN     "recurrenceStart" DATE,
ADD COLUMN     "recurrenceType" TEXT,
ADD COLUMN     "recurrenceUnit" TEXT;
