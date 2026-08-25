-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" DATE,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_areaId_archived_idx" ON "Project"("areaId", "archived");

-- CreateIndex
CREATE INDEX "FollowUp_projectId_idx" ON "FollowUp"("projectId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
