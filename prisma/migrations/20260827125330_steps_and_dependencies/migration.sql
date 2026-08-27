-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "followUpId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpDependency" (
    "id" TEXT NOT NULL,
    "followUpId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Step_followUpId_order_idx" ON "Step"("followUpId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpDependency_followUpId_dependsOnId_key" ON "FollowUpDependency"("followUpId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "FollowUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpDependency" ADD CONSTRAINT "FollowUpDependency_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "FollowUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpDependency" ADD CONSTRAINT "FollowUpDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "FollowUp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
