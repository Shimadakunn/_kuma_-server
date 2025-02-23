import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { FACTORY_ABI, FACTORY_ADDRESS } from "../../config/Factory";
import { client } from "../../config/PublicClient";

const prisma = new PrismaClient().$extends(withAccelerate());

// Helper function to format BigInt values
const formatValue = (value: bigint) => (Number(value) / 10 ** 6).toFixed(6);

type RewardResult = {
  address: string;
  status: "success" | "error";
  message: string;
  reward?: {
    amount: string;
    previousYield: string;
    currentYield: string;
  };
  error?: string;
};

export async function registerAllUsersRewards() {
  try {
    const users = await prisma.user.findMany();

    if (!users || users.length === 0) {
      return {
        status: "error",
        message: "No users found in the database",
      };
    }

    // Get current timestamp and yesterday's timestamp
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Array to store all registration results
    const registrationResults: RewardResult[] = [];

    // Process all users in a single transaction
    const results = await prisma.$transaction(async (tx) => {
      for (const user of users) {
        try {
          // Get current position (most recent position from database)
          const currentPosition = await tx.userPosition.findFirst({
            where: {
              userId: user.id,
            },
            orderBy: {
              timestamp: "desc",
            },
          });

          if (!currentPosition) {
            registrationResults.push({
              address: user.address,
              status: "error",
              message: "No position found",
            });
            continue;
          }

          // Get yesterday's position (first position older than yesterday)
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

          const currentYield = currentPosition.pendingYield;
          const previousYield = yesterdayPosition?.pendingYield || "0"; // Default to 0 if no older position exists

          // Calculate reward (difference in pending yield)
          const currentYieldNum = parseFloat(currentYield);
          const previousYieldNum = parseFloat(previousYield);
          const rewardAmount = Math.max(
            0,
            currentYieldNum - previousYieldNum
          ).toFixed(6);

          if (parseFloat(rewardAmount) > 0) {
            // Create reward action
            await tx.userAction.create({
              data: {
                userId: user.id,
                timestamp: now.toISOString(),
                action: "REWARDS",
                amount: rewardAmount,
                status: "success",
              },
            });

            registrationResults.push({
              address: user.address,
              status: "success",
              message: "Reward registered",
              reward: {
                amount: rewardAmount,
                previousYield,
                currentYield,
              },
            });
          } else {
            registrationResults.push({
              address: user.address,
              status: "success",
              message: "No new rewards",
              reward: {
                amount: "0",
                previousYield,
                currentYield,
              },
            });
          }
        } catch (error) {
          registrationResults.push({
            address: user.address,
            status: "error",
            message: "Failed to register reward",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return registrationResults;
    });

    const successCount = results.filter((r) => r.status === "success").length;
    const rewardCount = results.filter(
      (r) => r.reward && parseFloat(r.reward.amount) > 0
    ).length;
    const failureCount = results.filter((r) => r.status === "error").length;

    return {
      status: "success",
      message: `Processed ${successCount} users (${rewardCount} rewards, ${failureCount} failed)`,
      results: results,
    };
  } catch (error) {
    console.error("Error registering rewards:", error);
    return {
      status: "error",
      message: "Error registering rewards",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
