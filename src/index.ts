import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

// ABI for getUserPosition function
const abi = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserPosition",
    outputs: [
      { internalType: "uint256", name: "principal", type: "uint256" },
      { internalType: "uint256", name: "interest", type: "uint256" },
      { internalType: "uint256", name: "fee", type: "uint256" },
      { internalType: "uint256", name: "netWithdrawable", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Configure the client with your preferred RPC provider
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    "https://arbitrum-sepolia.infura.io/v3/a78ea67f650a46e8bd97f3262d1cef43"
  ), // Replace with your RPC URL
});

// Add color formatting constants at the top after imports
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
} as const;

// Timeframe enum
enum Timeframe {
  H = "H", // Hour
  D = "D", // Day
  W = "W", // Week
  M = "M", // Month
  Y = "Y", // Year
  ALL = "ALL", // All time
}

// Calculate blocks based on timeframe (4 blocks per second)
function getBlocksForTimeframe(timeframe: Timeframe): bigint {
  const BLOCKS_PER_SECOND = 8;
  const BLOCKS_PER_HOUR = BLOCKS_PER_SECOND * 3600;

  switch (timeframe) {
    case Timeframe.H:
      return BigInt(BLOCKS_PER_HOUR);
    case Timeframe.D:
      return BigInt(BLOCKS_PER_HOUR * 24);
    case Timeframe.W:
      return BigInt(BLOCKS_PER_HOUR * 24 * 7);
    case Timeframe.M:
      return BigInt(BLOCKS_PER_HOUR * 24 * 30);
    case Timeframe.Y:
      return BigInt(BLOCKS_PER_HOUR * 24 * 365);
    case Timeframe.ALL:
      return BigInt(0); // Will use block 0 as starting point
    default:
      throw new Error("Invalid timeframe");
  }
}

interface PositionData {
  blockNumber: number;
  timestamp: number;
  principal: number;
  interest: number;
  fee: number;
  netWithdrawable: number;
}

async function getHistoricalPositions(
  walletAddress: `0x${string}`,
  timeframe: Timeframe,
  dataPrecision: number = 10,
  contractCreatedBlock: bigint = BigInt(90453629)
) {
  try {
    let rpcCalls = 0;
    console.log("Starting RPC calls tracking...");

    // Get current block
    const currentBlock = await client.getBlockNumber();
    console.log("RPC Call #" + ++rpcCalls + ": getBlockNumber");

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

    // First, get all blocks in parallel to minimize RPC calls
    const blocks = await Promise.all(
      blockNumbers.map(async (blockNumber) => {
        const block = await client.getBlock({ blockNumber });
        console.log(
          "RPC Call #" + ++rpcCalls + ": getBlock for block " + blockNumber
        );
        return block;
      })
    );

    // Then, get all positions in parallel
    const positions = await Promise.all(
      blockNumbers.map(async (blockNumber, index) => {
        const position = await client.readContract({
          address: "0xDb6F3d43eAD99db3652a12058B614dDaec4447aB",
          abi,
          functionName: "getUserPosition",
          args: [walletAddress],
          blockNumber,
        });
        console.log(
          "RPC Call #" +
            ++rpcCalls +
            ": readContract getUserPosition for block " +
            blockNumber
        );

        // Convert BigInts to numbers and format to standard units (assuming 18 decimals)
        const DECIMALS = 6;
        const formatValue = (value: bigint) => Number(value) / 10 ** DECIMALS;

        return {
          blockNumber: Number(blockNumber),
          timestamp: Number(blocks[index].timestamp),
          principal: formatValue(position[0]),
          interest: formatValue(position[1]),
          fee: formatValue(position[2]),
          netWithdrawable: formatValue(position[3]),
        } as PositionData;
      })
    );

    console.log(
      `\nTotal RPC calls made: ${colors.yellow}${rpcCalls}${colors.reset}`
    );
    console.log(`1 call for getting current block`);
    console.log(`${dataPrecision} calls for getting block data`);
    console.log(`${dataPrecision} calls for getting positions`);
    console.log(
      `${colors.yellow}Total: ${1 + 2 * dataPrecision} RPC calls per execution${
        colors.reset
      }\n`
    );

    console.log(
      `${colors.bright}Historical positions for ${colors.cyan}${walletAddress}${colors.reset} over the last ${colors.green}${timeframe}${colors.reset}:`
    );
    positions.forEach(
      ({
        blockNumber,
        timestamp,
        principal,
        interest,
        fee,
        netWithdrawable,
      }) => {
        const date = new Date(timestamp * 1000);
        const formattedDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        console.log(
          `\n${colors.blue}${formattedDate}${colors.reset} (${colors.magenta}${blockNumber}${colors.reset})
           ${colors.bright}Principal:${colors.reset} ${colors.green}${principal}${colors.reset}
           ${colors.bright}Interest:${colors.reset} ${colors.yellow}${interest}${colors.reset}
           ${colors.bright}Fee:${colors.reset} ${colors.red}${fee}${colors.reset}
           ${colors.bright}Net Withdrawable:${colors.reset} ${colors.cyan}${netWithdrawable}${colors.reset}`
        );
      }
    );

    return positions;
  } catch (error) {
    console.error("Error fetching historical positions:", error);
    throw error;
  }
}

// Example usage
const exampleWallet = "0x1f29312f134C79984bA4b21840f2C3DcF57b9c85" as const;
getHistoricalPositions(exampleWallet, Timeframe.H, 5);
