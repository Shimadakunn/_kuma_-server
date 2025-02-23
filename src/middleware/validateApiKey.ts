import { NextFunction, Request, Response } from "express";

const API_KEY = process.env.API_KEY;

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!API_KEY) {
    console.error("API_KEY environment variable is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  if (apiKey !== API_KEY) {
    console.warn(`Invalid API key attempt: ${apiKey}`);
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
};
