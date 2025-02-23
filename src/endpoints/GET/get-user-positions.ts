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

const POSITIONS_COUNT = 20;

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

  let positions = user.userPositions.map((position: UserPosition) => ({
    ...position,
    timestamp: new Date(position.timestamp).toISOString(),
  }));

  // For timeframes other than 'H', we want exactly 20 positions
  if (timeframe !== "H") {
    if (positions.length >= POSITIONS_COUNT) {
      // If we have more positions than needed, select evenly distributed positions
      const step = Math.floor(positions.length / (POSITIONS_COUNT - 1));
      const distributedPositions = [];

      // Always include the most recent position
      distributedPositions.push(positions[0]);

      // Select evenly distributed positions
      for (let i = 1; i < POSITIONS_COUNT - 1; i++) {
        const index = i * step;
        if (index < positions.length) {
          distributedPositions.push(positions[index]);
        }
      }

      // Always include the oldest position if available
      if (positions.length > 1) {
        distributedPositions.push(positions[positions.length - 1]);
      }

      positions = distributedPositions;
    }

    // If we have fewer positions than needed, add empty positions
    if (positions.length < POSITIONS_COUNT) {
      const numEmptyPositions = POSITIONS_COUNT - positions.length;
      const lastTimestamp =
        positions.length > 0
          ? new Date(positions[positions.length - 1].timestamp)
          : startDate;

      const interval = milliseconds / (POSITIONS_COUNT - 1);
      const emptyPositions = Array.from(
        { length: numEmptyPositions },
        (_, index) => {
          const existingCount = positions.length;
          const position = existingCount + index + 1;
          const timestamp = new Date(startDate.getTime() + position * interval);
          return createEmptyPosition(timestamp.toISOString());
        }
      );

      positions.push(...emptyPositions);
    }
  } else if (positions.length < 5) {
    // For 'H' timeframe, ensure at least 5 positions
    const numEmptyPositions = 5 - positions.length;
    const lastTimestamp =
      positions.length > 0
        ? new Date(positions[positions.length - 1].timestamp)
        : startDate;

    const interval = milliseconds / 4; // Divide hour into 4 intervals for 5 points
    const emptyPositions = Array.from(
      { length: numEmptyPositions },
      (_, index) => {
        const timestamp = new Date(
          lastTimestamp.getTime() - (index + 1) * interval
        );
        return createEmptyPosition(timestamp.toISOString());
      }
    );

    positions.push(...emptyPositions);
  }

  // Sort positions by timestamp in descending order
  positions.sort(
    (a: Position, b: Position) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    ...user,
    userPositions: positions,
  };
}
