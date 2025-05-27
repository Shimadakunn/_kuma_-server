import express from "express";
import { prisma } from "@/utils";

const router = express.Router();

router.get("/set", async (req, res) => {
  // -- GET ALL USERS
  const users = await prisma.user.findMany();
  if (!users || users.length === 0)
    return res.status(404).json({ error: "No users found in the database" });

  // -- GET CURRENT AND YESTERDAY DATE
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // -- GET REWARDS FOR EACH USER
  // @ts-ignore
  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      // -- GET CURRENT POSITION
      const currentPosition = await tx.userPosition.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
      if (!currentPosition) continue;
      const currentYield = currentPosition.pendingYield;

      // -- GET YESTERDAY POSITION
      const yesterdayPosition = await tx.userPosition.findFirst({
        where: {
          userId: user.id,
          timestamp: {
            lt: yesterday.toISOString(), // Find first position older than yesterday
          },
        },
        orderBy: {
          timestamp: "desc", // Get the most recent one that's older than yesterday
        },
      });

      const previousYield = yesterdayPosition?.pendingYield || "0"; // 0 if no older position than yesterday

      // -- CALCULATE REWARD (DIFFERENCE IN PENDING YIELD OF CURRENT AND YESTERDAY POSITION)
      const currentYieldNum = parseFloat(currentYield);
      const previousYieldNum = parseFloat(previousYield);
      const rewardAmount = Math.max(
        0,
        currentYieldNum - previousYieldNum
      ).toFixed(6);

      // -- CREATE REWARD ACTION IF REWARD IS GREATER THAN 0
      if (parseFloat(rewardAmount) > 0) {
        await tx.userAction.create({
          data: {
            userId: user.id,
            timestamp: now.toISOString(),
            action: "REWARDS",
            amount: rewardAmount,
            status: "success",
          },
        });
      }
    }
  });

  return;
});
export default router;
