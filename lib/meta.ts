import { prisma } from "./prisma";

export async function getReferenceToday(): Promise<Date> {
  const meta = await prisma.meta.findUnique({ where: { id: 1 } });
  return meta?.today ?? new Date();
}
