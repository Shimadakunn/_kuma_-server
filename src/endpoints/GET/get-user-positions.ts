import { PrismaClient, UserPosition } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

type Timeframe = "H" | "D" | "M" | "Y";

const timeframeToMilliseconds = {
  H: 60 * 60 * 1000, // 1 hour
  D: 24 * 60 * 60 * 1000, // 1 day
  M: 30 * 24 * 60 * 60 * 1000, // ~1 month
  Y: 365 * 24 * 60 * 60 * 1000, // ~1 year
};

type Position = UserPosition;

const createEmptyPosition = (timestamp: string): Position => ({
  id: -1,
  userId: -1,
  timestamp,
  vaultBalance: "0",
  lastRecordedBalance: "0",
  pendingYield: "0",
  pendingFee: "0",
  userBalance: "0",
  userPrincipal: "0",
  totalCollectedFees: "0",
});

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

  const positions = user.userPositions.map((position: UserPosition) => ({
    ...position,
    timestamp: new Date(position.timestamp).toISOString(),
  }));

  // If we have no positions or less than 5, we need to add empty positions
  if (positions.length < 5) {
    const numEmptyPositions = Math.max(5 - positions.length, 0);
    const lastTimestamp =
      positions.length > 0
        ? new Date(positions[positions.length - 1].timestamp)
        : startDate;

    // Create empty positions with timestamps before the existing data
    const emptyPositions = Array.from(
      { length: numEmptyPositions },
      (_, index) => {
        const timestamp = new Date(
          lastTimestamp.getTime() - (index + 1) * (milliseconds / 5)
        );
        return createEmptyPosition(timestamp.toISOString());
      }
    );

    positions.push(...emptyPositions);
    // Sort positions by timestamp in descending order
    positions.sort(
      (a: Position, b: Position) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return {
    ...user,
    userPositions: positions,
  };
}
