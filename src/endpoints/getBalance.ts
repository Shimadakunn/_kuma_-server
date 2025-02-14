import { FACTORY_ABI, FACTORY_ADDRESS } from "../config/Factory";
import { client } from "../config/PublicClient";

interface BalanceResponse {
  status: "success" | "error";
  data: {
    userBalance: string;
    userPrincipal: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export async function getCurrentBalance(
  walletAddress: `0x${string}`
): Promise<BalanceResponse> {
  try {
    const position = (await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "position",
      args: [walletAddress],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    // Format BigInt values with proper decimals
    const formatValue = (value: bigint) => (Number(value) / 10 ** 6).toFixed(6);

    return {
      status: "success",
      data: {
        userBalance: formatValue(position[4]),
        userPrincipal: formatValue(position[5]),
      },
    };
  } catch (error) {
    console.error("Error fetching current balance:", error);
    return {
      status: "error",
      data: {
        userBalance: "0",
        userPrincipal: "0",
      },
      error: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: "FETCH_ERROR",
      },
    };
  }
}
