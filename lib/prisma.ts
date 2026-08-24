import { PrismaClient } from "@prisma/client";

// Different Postgres storage products on Vercel name their connection string
// env var differently (POSTGRES_PRISMA_URL, POSTGRES_URL, ...). Resolve to
// the canonical DATABASE_URL Prisma expects before it's read, so it doesn't
// matter which one got connected to the project.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    "";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
