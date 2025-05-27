import express from "express";
import {
  getUser,
  validateWallet,
  validateAction,
  validateAmount,
  prisma,
} from "@/utils";
import { Action } from "@prisma/client";

const router = express.Router();

router.get("/get/:wallet", validateWallet, async (req, res) => {
  // -- GET USER
  const user = await getUser(req.params.wallet, true, false);
  if (!user) return res.status(404).json({ error: "User not found" });

  // -- RETURN USER ACTIONS
  return res.json(user.userActions);
});

router.get(
  "/set/:wallet/:action/:amount",
  validateWallet,
  validateAction,
  validateAmount,
  async (req, res) => {
    // -- GET USER
    const user = await getUser(req.params.wallet);
    if (!user) return res.status(404).json({ error: "User not found" });

    // -- CREATE USER ACTION
    const userAction = await prisma.userAction.create({
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        action: req.params.action as Action,
        amount: req.params.amount,
        status: "success",
      },
    });

    // -- RETURN USER ACTION
    return res.json(userAction);
  }
);

export default router;
