import { PrismaClient, Action } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUserNotification(
  walletAddress: string,
  notifications: boolean
) {
  const user = await prisma.user.findUnique({
    where: {
      address: walletAddress,
    },
  });

  if (!user) {
    return {
      status: "error",
      message: "User not found",
    };
  }
  const notificationData = await prisma.user.update({
    where: {
      address: walletAddress,
    },
    data: {
      notifications: notifications,
    },
  });

  return {
    status: "success",
    message: "User notification updated",
    notificationData,
  };
}
