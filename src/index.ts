import { createPublicClient, erc20Abi, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

// Configure the client with your preferred RPC provider
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    "https://arbitrum-sepolia.infura.io/v3/a78ea67f650a46e8bd97f3262d1cef43"
  ), // Replace with your RPC URL
});

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
  const BLOCKS_PER_SECOND = 4;
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

async function getHistoricalBalances(
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

    const interval = (currentBlock - startBlock) / BigInt(dataPrecision - 1); // intervals for dataPrecision points

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

    // Then, get all balances in parallel
    const balances = await Promise.all(
      blockNumbers.map(async (blockNumber, index) => {
        const balance = await client.readContract({
          address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [walletAddress],
          blockNumber,
        });
        console.log(
          "RPC Call #" +
            ++rpcCalls +
            ": readContract balanceOf for block " +
            blockNumber
        );
        const formattedBalance = Number(balance) / 10 ** 6;

        return {
          blockNumber: Number(blockNumber),
          balance: formattedBalance,
          timestamp: blocks[index].timestamp,
        };
      })
    );

    console.log(`\nTotal RPC calls made: ${rpcCalls}`);
    console.log("1 call for getting current block");
    console.log(`${dataPrecision} calls for getting block data`);
    console.log(`${dataPrecision} calls for getting balances`);
    console.log(`Total: ${1 + 2 * dataPrecision} RPC calls per execution\n`);

    console.log(
      `Historical balances for ${walletAddress} over the last ${timeframe}:`
    );
    balances.forEach(({ blockNumber, balance, timestamp }) => {
      const date = new Date(Number(timestamp) * 1000);
      console.log(`Block ${blockNumber} (${date.toISOString()}): ${balance}`);
    });

    return balances;
  } catch (error) {
    console.error("Error fetching historical balances:", error);
    throw error;
  }
}

// Example usage
const exampleWallet = "0x1f29312f134C79984bA4b21840f2C3DcF57b9c85" as const;
getHistoricalBalances(exampleWallet, Timeframe.H, 5);
