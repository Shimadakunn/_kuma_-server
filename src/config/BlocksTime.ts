enum Timeframe {
  H = "H", // Hour
  D = "D", // Day
  W = "W", // Week
  M = "M", // Month
  Y = "Y", // Year
  ALL = "ALL", // All time
}

export { Timeframe };

function getBlocksForTimeframe(timeframe: Timeframe): bigint {
  const BLOCKS_PER_SECOND = 4;
  const BLOCKS_PER_HOUR = BLOCKS_PER_SECOND * 3600;

  switch (timeframe) {
    case Timeframe.H:
      return BigInt(BLOCKS_PER_HOUR);
    case Timeframe.D:
      return BigInt(BLOCKS_PER_HOUR * 24);
    case Timeframe.W:
      return BigInt(BLOCKS_PER_HOUR * 24 * 7);
    case Timeframe.M:
      return BigInt(BLOCKS_PER_HOUR * 24 * 30);
    case Timeframe.Y:
      return BigInt(BLOCKS_PER_HOUR * 24 * 365);
    case Timeframe.ALL:
      return BigInt(0); // Will use block 0 as starting point
    default:
      throw new Error("Invalid timeframe");
  }
}

export { getBlocksForTimeframe };
