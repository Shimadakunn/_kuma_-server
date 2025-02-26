import { NextFunction, Request, Response } from "express";

enum Timeframe {
  H = "1H", // Hour
  D = "1D", // Day
  W = "1W", // Week
  M = "1M", // Month
  Y = "1Y", // Year
  ALL = "ALL", // All time
}

// Middleware to validate timeframe
export const validateTimeframe = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timeframe = req.params.timeframe.toUpperCase();
  if (!Object.values(Timeframe).includes(timeframe as Timeframe)) {
    return res.status(400).json({
      error: "Invalid timeframe",
      validTimeframes: Object.values(Timeframe),
    });
  }
  next();
};
