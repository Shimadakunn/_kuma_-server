import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export const getUser = async (
  wallet: string,
  userActions: boolean = false,
  userPositions: boolean = false
) => {
  // -- GET USER
  const user = await prisma.user.findUnique({
    where: {
      wallet,
    },
    include: {
      userActions: userActions,
      userPositions: userPositions,
    },
  });

  // -- CHECK IF USER EXISTS
  if (!user) return null;
  return user;
};
