import { prisma } from "@repo/db/prisma";
export async function createProfile(userId: string, walletAddress: string) {
  return prisma.profile.create({
    data: { userId, walletAddress },
  });
}

export async function getProfileByUserId(userId: string) {
  return prisma.profile.findUnique({ where: { userId } });
}
export async function updateProfile(userId: string, walletAddress: string) {
  return prisma.profile.update({
    where: { userId },
    data: { walletAddress },
  });
  
}
