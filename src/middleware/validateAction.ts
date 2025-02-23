import { Action } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export const validateAction = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const action = req.params.action?.toUpperCase();
  if (!action || !Object.values(Action).includes(action as Action)) {
    return res.status(400).json({
      error: "Invalid action type",
      validActions: Object.values(Action),
    });
  }
  next();
};
