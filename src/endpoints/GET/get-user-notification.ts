import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function getUserNotification(walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: {
      address: walletAddress,
    },
  });
  if (!user) {
    return null;
  }
  return user;
}
