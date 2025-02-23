import { NextFunction, Request, Response } from "express";

// Middleware to validate wallet address
export const validateWalletAddress = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const walletAddress = req.params.walletAddress || req.body.address;
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address format" });
  }
  next();
};
