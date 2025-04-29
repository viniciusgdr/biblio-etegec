import { prisma } from '@/lib/prisma';

export async function getUserFromDb(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return user;
}