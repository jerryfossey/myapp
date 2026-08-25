-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "followUpId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cashOnHand" DOUBLE PRECISION NOT NULL,
    "helocBalance" DOUBLE PRECISION NOT NULL,
    "cashTarget" DOUBLE PRECISION NOT NULL,
    "asOf" DATE NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeWeek" (
    "week" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "planned" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION,

    CONSTRAINT "TimeWeek_pkey" PRIMARY KEY ("week","categoryId")
);

-- CreateIndex
CREATE INDEX "StatusEvent_areaId_at_idx" ON "StatusEvent"("areaId", "at");

-- CreateIndex
CREATE INDEX "StatusEvent_to_at_idx" ON "StatusEvent"("to", "at");

-- CreateIndex
CREATE INDEX "Snapshot_kind_at_idx" ON "Snapshot"("kind", "at");
