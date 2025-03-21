import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { registerUserPosition } from "./register-user-position";
const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUser(address: string, email: string) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ address }, { email }],
    },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { lastConnectedAt: new Date() },
    });
    return existingUser;
  }

  const user = await prisma.user.create({
    data: {
      address,
      email,
      lastConnectedAt: new Date(),
    },
  });

  await prisma.userPosition.create({
    data: {
      userId: user.id,
      timestamp: new Date().toISOString(),
      vaultBalance: "0",
      lastRecordedBalance: "0",
      pendingYield: "0",
      pendingFee: "0",
      userBalance: "0",
      userPrincipal: "0",
      totalCollectedFees: "0",
    },
  });
  registerUserPosition(address);

  return user;
}
