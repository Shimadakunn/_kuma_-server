import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUserAction(
  walletAddress: string,
  action: "DEPOSIT" | "WITHDRAW",
  amount: string
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
  const actionData = await prisma.userAction.create({
    data: {
      userId: user.id,
      timestamp: new Date().toISOString(),
      action: action as "DEPOSIT" | "WITHDRAW",
      amount: amount,
      status: "success",
    },
  });

  return {
    status: "success",
    message: "User action registered",
    actionData,
  };
}
