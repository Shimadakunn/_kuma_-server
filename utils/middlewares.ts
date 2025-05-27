import { Action } from "@prisma/client";
import type { Timeframe } from "./types.js";
import { NextFunction, Request, Response } from "express";

const VALID_TIMEFRAMES: Timeframe[] = ["1H", "1D", "1W", "1M", "1Y", "MAX"];

export const validateWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const wallet = req.params.wallet;
  console.log("validateWallet", wallet);
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet))
    return res.status(400).json({ error: "Invalid wallet format" });
  next();
};

export const validateAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const action = req.params.action;
  console.log("validateAction", action);
  if (!Object.values(Action).includes(action as Action))
    return res.status(400).json({ error: "Invalid action" });
  next();
};

export const validateAmount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const amount = req.params.amount;
  console.log("validateAmount", amount);
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return res.status(400).json({ error: "Invalid amount" });
  next();
};

export const validateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.params.email;
  console.log("validateEmail", email);
  if (!email || !email.includes("@"))
    return res.status(400).json({ error: "Invalid email" });
  next();
};

export const validateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const notification = req.params.notification;
  console.log("validateNotification", notification);
  if (notification !== "true" && notification !== "false")
    return res
      .status(400)
      .json({ error: "Invalid notification - must be true or false" });
  next();
};

export const validateTimeframe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const timeframe = req.params.timeframe;
  console.log("validateTimeframe", timeframe);
  if (!VALID_TIMEFRAMES.includes(timeframe as Timeframe))
    return res.status(400).json({ error: "Invalid timeframe" });
  next();
};
