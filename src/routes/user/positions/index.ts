import express from "express";
import {
  validateWallet,
  getUser,
  validateTimeframe,
  prisma,
  type Timeframe,
} from "@/utils";
import { setUserPosition } from "./set";
import { getUserPositions } from "./get";

const router = express.Router();

router.get(
  "/get/:wallet/:timeframe",
  validateWallet,
  validateTimeframe,
  async (req, res) => {
    // -- GET USER
    const user = await getUser(req.params.wallet, false, true);
    if (!user) return res.status(404).json({ error: "User not found" });

    // -- GET USER POSITIONS
    const timeframe = req.params.timeframe as Timeframe;
    const userPositions = await getUserPositions(user, timeframe);

    // -- RETURN USER POSITIONS
    return res.json(userPositions);
  }
);

router.get("/set/:wallet", validateWallet, async (req, res) => {
  // -- GET USER
  const user = await getUser(req.params.wallet, false, true);
  if (!user) return res.status(404).json({ error: "User not found" });

  // -- SET USER POSITION
  const userPosition = await setUserPosition(user);

  // -- RETURN USER POSITION
  return res.json(userPosition);
});

router.get("/set", async (req, res) => {
  // -- GET ALL USERS
  const users = await prisma.user.findMany();
  if (!users || users.length === 0)
    return res.status(404).json({ error: "No users found in the database" });

  // -- SET POSITION FOR EACH USER
  const userPositions = [];
  for (const user of users) {
    const userPosition = await setUserPosition(user);
    userPositions.push(userPosition);
  }

  // -- RETURN USER POSITIONS
  return res.json(userPositions);
});

export default router;
