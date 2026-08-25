-- CreateTable
CREATE TABLE "TimeUploadLog" (
    "week" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeUploadLog_pkey" PRIMARY KEY ("week","date")
);
