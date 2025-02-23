import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { FACTORY_ABI, FACTORY_ADDRESS } from "../../config/Factory";
import { client } from "../../config/PublicClient";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerUserPosition(walletAddress: string) {
  try {
    const position = (await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "position",
      args: [walletAddress],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    // Format BigInt values with proper decimals
    const formatValue = (value: bigint) => (Number(value) / 10 ** 6).toFixed(6);

    const user = await prisma.user.findUnique({
      where: {
        address: walletAddress,
      },
    });

    if (!user) {
      return {
        status: "error",
        message: "User not found",
      };
    }

    const userPosition = await prisma.userPosition.create({
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        vaultBalance: formatValue(position[0]),
        lastRecordedBalance: formatValue(position[1]),
        pendingYield: formatValue(position[2]),
        pendingFee: formatValue(position[3]),
        userBalance: formatValue(position[4]),
        userPrincipal: formatValue(position[5]),
        totalCollectedFees: formatValue(position[6]),
      },
    });

    return {
      status: "success",
      message: "Snapshot position created",
      userPosition,
    };
  } catch (error) {
    console.error("Error fetching position:", error);
    return {
      status: "error",
      message: "Error fetching position",
    };
  }
}
