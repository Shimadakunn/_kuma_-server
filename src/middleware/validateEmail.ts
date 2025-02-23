import { NextFunction, Request, Response } from "express";

export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.params.email || req.body.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
};
