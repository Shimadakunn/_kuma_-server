import { Timeframe, getBlocksForTimeframe } from "./config/BlocksTime";
import { colors } from "./config/Colors";
import {
  FACTORY_ABI,
  FACTORY_ADDRESS,
  FACTORY_CREATION_BLOCK,
} from "./config/Factory";
import { client } from "./config/PublicClient";

export async function getOwner(
  timeframe: Timeframe,
  dataPrecision: number = 10,
  contractCreatedBlock: bigint = BigInt(FACTORY_CREATION_BLOCK)
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

    // Then, get all positions in parallel
    const owner = await Promise.all(
      blockNumbers.map(async (blockNumber, index) => {
        const owner = (await client.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "owner",
          args: [],
          blockNumber,
        })) as `0x${string}`;

        console.log(
          "RPC Call #" +
            ++rpcCalls +
            ": readContract position for block " +
            blockNumber
        );

        return {
          blockNumber: Number(blockNumber),
          owner: owner,
          timestamp: blocks[index].timestamp,
        };
      })
    );

    console.log(owner);

    console.log(
      `\nTotal RPC calls made: ${colors.yellow}${rpcCalls}${colors.reset}`
    );
    console.log("1 call for getting current block");
    console.log(`${dataPrecision} calls for getting block data`);
    console.log(`1 call for getting owner`);
    console.log(
      `${colors.yellow}Total: ${1 + 2 * dataPrecision} RPC calls per execution${
        colors.reset
      }\n`
    );

    console.log(
      `${colors.bright}Owner of the factory: ${colors.cyan}${owner}${colors.reset}`
    );
  } catch (error) {
    console.error("Error fetching owner:", error);
    throw error;
  }
}
