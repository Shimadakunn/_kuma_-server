import type { Timeframe } from "./types";

export const formatValue = (value: bigint) =>
  (Number(value) / 10 ** 6).toFixed(6);

export const getPositionsCount = (timeframe: Timeframe) =>
  timeframe === "1H" ? null : 20;

export const getStartDate = (timeframe: Timeframe) =>
  timeframe === "MAX"
    ? new Date(0)
    : new Date(Date.now() - timeframeToMilliseconds[timeframe]);

export const timeframeToMilliseconds = {
  "1H": 60 * 60 * 1000, // 1 hour
  "1D": 24 * 60 * 60 * 1000, // 1 day
  "1W": 7 * 24 * 60 * 60 * 1000, // 1 week
  "1M": 30 * 24 * 60 * 60 * 1000, // ~1 month
  "1Y": 365 * 24 * 60 * 60 * 1000, // ~1 year
};

export const emptyUserPosition = (userId: number, date: Date) => ({
  id: undefined,
  userId,
  timestamp: date.toISOString(),
  vaultBalance: "0",
  lastRecordedBalance: "0",
  pendingYield: "0",
  pendingFee: "0",
  userBalance: "0",
  userPrincipal: "0",
  totalCollectedFees: "0",
});
