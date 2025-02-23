import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

type Timeframe = "H" | "D" | "M" | "Y";

const timeframeToMilliseconds = {
  H: 60 * 60 * 1000, // 1 hour
  D: 24 * 60 * 60 * 1000, // 1 day
  M: 30 * 24 * 60 * 60 * 1000, // ~1 month
  Y: 365 * 24 * 60 * 60 * 1000, // ~1 year
};

export async function getUserPositions(address: string, timeframe: Timeframe) {
  const milliseconds = timeframeToMilliseconds[timeframe];
  const startDate = new Date(Date.now() - milliseconds);

  const user = await prisma.user.findUnique({
    where: {
      address,
    },
    include: {
      userPositions: {
        where: {
          timestamp: {
            gte: startDate.toISOString(),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    userPositions: user.userPositions.map((position) => ({
      ...position,
      timestamp: new Date(position.timestamp).toISOString(),
    })),
  };
}
