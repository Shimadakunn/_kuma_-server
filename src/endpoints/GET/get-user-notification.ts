import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function getUserNotification(address: string) {
  const user = await prisma.user.findUnique({
    where: {
      address,
    },
  });
  if (!user) {
    return null;
  }
  return user.notifications;
}
