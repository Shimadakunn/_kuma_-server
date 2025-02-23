import { NextFunction, Request, Response } from "express";

export const validateAmount = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const amount = req.params.amount;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }
  next();
};
