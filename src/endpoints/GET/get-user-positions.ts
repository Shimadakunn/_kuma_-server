import { PrismaClient, UserPosition } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export type Timeframe = "1H" | "1D" | "1W" | "1M" | "1Y" | "MAX";

const timeframeToMilliseconds = {
  "1H": 60 * 60 * 1000, // 1 hour
  "1D": 24 * 60 * 60 * 1000, // 1 day
  "1W": 7 * 24 * 60 * 60 * 1000, // 1 week
  "1M": 30 * 24 * 60 * 60 * 1000, // ~1 month
  "1Y": 365 * 24 * 60 * 60 * 1000, // ~1 year
  MAX: Infinity,
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

const getPositionsCount = (timeframe: Timeframe) =>
  timeframe === "1H" ? null : 20;

export async function getUserPositions(address: string, timeframe: Timeframe) {
  const POSITIONS_COUNT = getPositionsCount(timeframe);
  const startDate =
    timeframe === "MAX"
      ? new Date(0) // Unix epoch start for MAX timeframe
      : new Date(Date.now() - timeframeToMilliseconds[timeframe]);

  const user = await prisma.user.findUnique({
    where: { address },
    include: {
      userPositions: {
        where: {
          timestamp: { gte: startDate.toISOString() },
        },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!user) return null;

  let positions = user.userPositions.map((position: UserPosition) => ({
    ...position,
    timestamp: new Date(position.timestamp).toISOString(),
  }));

  // For 1H timeframe, return all positions without distribution
  if (POSITIONS_COUNT === null) {
    if (positions.length < 3) {
      const timeRange = Date.now() - startDate.getTime();
      const interval = timeRange / 6; // Divide into 6 segments to get 5 points
      const numEmptyPositions = 5 - positions.length;

      const emptyPositions = Array.from(
        { length: numEmptyPositions },
        (_, index) => {
          const timestamp = new Date(
            startDate.getTime() + interval * (index + 1)
          );
          return createEmptyPosition(timestamp.toISOString());
        }
      );

      positions = [...positions, ...emptyPositions].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return {
      ...user,
      userPositions: positions,
    };
  }

  // For other timeframes, keep the distribution logic
  if (positions.length >= POSITIONS_COUNT) {
    // Keep most recent position
    const distributedPositions = [positions[0]];

    // Calculate step size for 18 middle positions
    const step = Math.floor((positions.length - 2) / (POSITIONS_COUNT - 2));

    // Select 18 evenly distributed positions
    for (let i = 1; i < POSITIONS_COUNT - 1; i++) {
      const index = 1 + (i - 1) * step;
      distributedPositions.push(
        positions[Math.min(index, positions.length - 2)]
      );
    }

    // Add oldest position
    distributedPositions.push(positions[positions.length - 1]);

    positions = distributedPositions;
  } else {
    // If we have fewer positions, add empty positions before the oldest one
    const numEmptyPositions = POSITIONS_COUNT - positions.length;
    const oldestExistingTimestamp =
      positions.length > 0
        ? new Date(positions[positions.length - 1].timestamp)
        : new Date();

    const timeRange = oldestExistingTimestamp.getTime() - startDate.getTime();
    const interval = timeRange / (numEmptyPositions + 1);

    const emptyPositions = Array.from(
      { length: numEmptyPositions },
      (_, index) => {
        const timestamp = new Date(
          startDate.getTime() + interval * (index + 1)
        );
        return createEmptyPosition(timestamp.toISOString());
      }
    );

    positions = [...positions, ...emptyPositions];
  }

  // Sort by timestamp descending
  positions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    ...user,
    userPositions: positions,
  };
}
