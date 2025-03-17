import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerWaitingList(email: string) {
  const waitingList = await prisma.waitingList.findFirst({
    where: {
      email,
    },
  });

  if (waitingList) {
    return waitingList;
  }

  const newWaitingList = await prisma.waitingList.create({
    data: { email },
  });

  return newWaitingList;
}
