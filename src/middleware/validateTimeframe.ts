import { NextFunction, Request, Response } from "express";

enum Timeframe {
  H = "H", // Hour
  D = "D", // Day
  W = "W", // Week
  M = "M", // Month
  Y = "Y", // Year
  ALL = "ALL", // All time
}

export { Timeframe };

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
