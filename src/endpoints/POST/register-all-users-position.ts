import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { FACTORY_ABI, FACTORY_ADDRESS } from "../../config/Factory";
import { client } from "../../config/PublicClient";

const prisma = new PrismaClient().$extends(withAccelerate());

// Helper function to format BigInt values
const formatValue = (value: bigint) => (Number(value) / 10 ** 6).toFixed(6);

type PositionResult = {
  address: string;
  status: "success" | "error";
  message: string;
  userPosition?: any;
  error?: string;
};

export async function registerAllUsersPosition() {
  try {
    // Get all users from the database in a single query
    const users = await prisma.user.findMany();

    if (!users || users.length === 0) {
      return {
        status: "error",
        message: "No users found in the database",
      };
    }

    // Array to store all registration results
    const registrationResults: PositionResult[] = [];
    const timestamp = new Date().toISOString();

    // Create all positions in a single transaction
    const results = await prisma.$transaction(async (tx) => {
      for (const user of users) {
        try {
          const position = (await client.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: "position",
            args: [user.address],
          })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

          const userPosition = await tx.userPosition.create({
            data: {
              userId: user.id,
              timestamp: timestamp,
              vaultBalance: formatValue(position[0]),
              lastRecordedBalance: formatValue(position[1]),
              pendingYield: formatValue(position[2]),
              pendingFee: formatValue(position[3]),
              userBalance: formatValue(position[4]),
              userPrincipal: formatValue(position[5]),
              totalCollectedFees: formatValue(position[6]),
            },
          });

          registrationResults.push({
            address: user.address,
            status: "success",
            message: "Snapshot position created",
            userPosition,
          });
        } catch (error) {
          registrationResults.push({
            address: user.address,
            status: "error",
            message: "Failed to create position",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return registrationResults;
    });

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "error").length;

    return {
      status: "success",
      message: `Registered positions for ${successCount} users (${failureCount} failed)`,
      results: results,
    };
  } catch (error) {
    console.error("Error registering all users positions:", error);
    return {
      status: "error",
      message: "Error registering all users positions",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
