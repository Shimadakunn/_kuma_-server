import { NextFunction, Request, Response } from "express";

const API_KEY = process.env.API_KEY;

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};
