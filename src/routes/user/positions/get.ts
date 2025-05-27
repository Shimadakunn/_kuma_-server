import {
  emptyUserPosition,
  getPositionsCount,
  getStartDate,
  prisma,
  type Timeframe,
} from "@/utils";
import { type User, type UserPosition } from "@prisma/client";

export async function getUserPositions(user: User, timeframe: Timeframe) {
  console.log("getUserPositions", user.wallet, timeframe);

  // -- GET START DATE FROM TIMEFRAME
  const startDate = getStartDate(timeframe);

  // -- GET USER POSITIONS
  const userPositions = await prisma.userPosition.findMany({
    where: {
      userId: user.id,
      timestamp: { gte: startDate.toISOString() },
    },
    orderBy: { timestamp: "desc" },
  });

  // -- GET POSITIONS COUNT
  const POSITIONS_COUNT = getPositionsCount(timeframe);

  // -- FORMAT USER POSITIONS
  let positions = userPositions.map((position: UserPosition) => ({
    ...position,
    timestamp: new Date(position.timestamp).toISOString(),
  }));

  // -- HANDLE WHEN TIMEFRAME IS 1H
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
          return emptyUserPosition(user.id, timestamp);
        }
      );

      positions = [...positions, ...emptyPositions] as UserPosition[];

      // @ts-ignore
      positions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return positions;
  }

  // -- HANDLE FOR OTHER TIMEFRAMES
  if (positions.length >= POSITIONS_COUNT) {
    // -- KEEP MOST RECENT POSITION
    const distributedPositions = [positions[0]];

    // -- CALCULATE STEP SIZE FOR 18 MIDDLE POSITIONS
    const step = Math.floor((positions.length - 2) / (POSITIONS_COUNT - 2));

    // -- SELECT 18 EVENLY DISTRIBUTED POSITIONS
    for (let i = 1; i < POSITIONS_COUNT - 1; i++) {
      const index = 1 + (i - 1) * step;
      distributedPositions.push(
        positions[Math.min(index, positions.length - 2)]
      );
    }

    // -- ADD OLDEST POSITION
    distributedPositions.push(positions[positions.length - 1]);

    positions = distributedPositions.filter(
      (position): position is UserPosition => position !== undefined
    );
  } else {
    // -- ADD EMPTY POSITIONS BEFORE THE OLDEST ONE
    const numEmptyPositions = POSITIONS_COUNT - positions.length;
    const oldestExistingTimestamp =
      positions.length > 0
        ? new Date(positions[positions.length - 1]!.timestamp)
        : new Date();

    const timeRange = oldestExistingTimestamp.getTime() - startDate.getTime();
    const interval = timeRange / (numEmptyPositions + 1);

    const emptyPositions = Array.from(
      { length: numEmptyPositions },
      (_, index) => {
        const timestamp = new Date(
          startDate.getTime() + interval * (index + 1)
        );
        return emptyUserPosition(user.id, timestamp);
      }
    );

    positions = [...positions, ...emptyPositions] as UserPosition[];
  }

  // -- SORT BY TIMESTAMP DESCENDING
  // @ts-ignore
  positions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return positions;
}
