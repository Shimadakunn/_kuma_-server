import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUser(address: string, email: string) {
  const user = await prisma.user.create({
    data: {
      address,
      email,
    },
  });
  return user;
}
