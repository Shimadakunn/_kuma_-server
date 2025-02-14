import { Timeframe, getBlocksForTimeframe } from "../config/BlocksTime";
import {
  FACTORY_ABI,
  FACTORY_ADDRESS,
  FACTORY_CREATION_BLOCK,
} from "../config/Factory";
import { client } from "../config/PublicClient";

interface PositionData {
  blockNumber: number;
  timestamp: number;
  data: {
    vaultBalance: string;
    lastRecordedBalance: string;
    pendingYield: string;
    pendingFee: string;
    userBalance: string;
    userPrincipal: string;
    totalCollectedFees: string;
  };
}

interface PositionsResponse {
  status: "success" | "error";
  data: {
    wallet: string;
    timeframe: string;
    startBlock: number;
    endBlock: number;
    positions: PositionData[];
    metadata: {
      dataPrecision: number;
      totalBlocks: number;
      contractAddress: string;
    };
  };
  error?: {
    message: string;
    code?: string;
  };
}

export async function getPositions(
  walletAddress: `0x${string}`,
  timeframe: Timeframe,
  dataPrecision: number = 10,
  contractCreatedBlock: bigint = BigInt(FACTORY_CREATION_BLOCK)
): Promise<PositionsResponse> {
  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();

    // Calculate blocks to go back based on timeframe
    const blocksToGoBack = getBlocksForTimeframe(timeframe);

    // For "ALL" timeframe, we'll start from contract creation block, otherwise calculate start block
    // but never go before contract creation block
    const calculatedStartBlock =
      timeframe === Timeframe.ALL
        ? contractCreatedBlock
        : currentBlock - blocksToGoBack;
    const startBlock =
      calculatedStartBlock < contractCreatedBlock
        ? contractCreatedBlock
        : calculatedStartBlock;

    const interval = (currentBlock - startBlock) / BigInt(dataPrecision - 1);

    // Generate block numbers from current block going back to start block
    const blockNumbers = Array.from(
      { length: dataPrecision },
      (_, i) => currentBlock - interval * BigInt(i)
    );

    // Get all blocks timestamps in parallel
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await client.getBlock({ blockNumber });
        return block;
      })
    );

    // Then, get all positions in parallel
    const positions = await Promise.all(
      blockNumbers.map(async (blockNumber, index) => {
        const position = (await client.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "position",
          args: [walletAddress],
          blockNumber,
        })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

        // Format BigInt values with proper decimals
        const formatValue = (value: bigint) =>
          (Number(value) / 10 ** 6).toFixed(6);

        return {
          blockNumber: Number(blockNumber),
          timestamp: Number(blocks[index].timestamp),
          data: {
            vaultBalance: formatValue(position[0]),
            lastRecordedBalance: formatValue(position[1]),
            pendingYield: formatValue(position[2]),
            pendingFee: formatValue(position[3]),
            userBalance: formatValue(position[4]),
            userPrincipal: formatValue(position[5]),
            totalCollectedFees: formatValue(position[6]),
          },
        } as PositionData;
      })
    );

    // Format the response
    const response: PositionsResponse = {
      status: "success",
      data: {
        wallet: walletAddress,
        timeframe: timeframe,
        startBlock: Number(startBlock),
        endBlock: Number(currentBlock),
        positions: positions,
        metadata: {
          dataPrecision,
          totalBlocks: Number(currentBlock - startBlock),
          contractAddress: FACTORY_ADDRESS,
        },
      },
    };

    positions.forEach(({ blockNumber, timestamp, data }) => {
      const date = new Date(timestamp * 1000);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    });

    return response;
  } catch (error) {
    console.error("Error fetching historical positions:", error);
    return {
      status: "error",
      data: {
        wallet: walletAddress,
        timeframe: timeframe,
        startBlock: 0,
        endBlock: 0,
        positions: [],
        metadata: {
          dataPrecision,
          totalBlocks: 0,
          contractAddress: FACTORY_ADDRESS,
        },
      },
      error: {
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        code: "FETCH_ERROR",
      },
    };
  }
}
