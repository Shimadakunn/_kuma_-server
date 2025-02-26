import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUser(address: string, email: string) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ address }, { email }],
    },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: { lastConnectedAt: new Date() },
    });
  }

  const user = await prisma.user.create({
    data: {
      address,
      email,
      lastConnectedAt: new Date(),
    },
  });

  return user;
}
