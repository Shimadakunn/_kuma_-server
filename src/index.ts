import dotenv from "dotenv";
import {
  Address,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { MULTICALL3_ABI } from "./config/abi";
dotenv.config();

const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;
const AVG_BLOCK_TIME = 12; // Average block time in seconds for Arbitrum Sepolia

const contractAbi = parseAbi([
  "function getUserPosition(address user) view returns (uint256 principal, uint256 interest, uint256 fee, uint256 netWithdrawable)",
]);

// Replace with the actual deployed contract address:
const contractAddress = "0xYourContractAddressHere";

// The user whose position we want to check:
const userAddress = "0x1f29312f134C79984bA4b21840f2C3DcF57b9c85";

// Create a viem client connected to your archive node provider
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  ),
});

type UserPosition = [bigint, bigint, bigint, bigint];

type MulticallResult = {
  success: boolean;
  returnData: `0x${string}`;
}[];

async function estimateHistoricalBlock(hoursAgo: number): Promise<bigint> {
  const latestBlock = await client.getBlock();
  if (!latestBlock) throw new Error("No latest block found!");

  // Calculate blocks per hour based on average block time
  const blocksPerHour = Math.floor(3600 / AVG_BLOCK_TIME);
  const blockDiff = BigInt(blocksPerHour * hoursAgo);

  const estimatedBlock = latestBlock.number - blockDiff;
  console.log(`Latest block: #${latestBlock.number}`);
  console.log(`Estimated ${hoursAgo} hours ago block: #${estimatedBlock}`);

  return estimatedBlock;
}

/**
 * Fetches multiple user positions in a single call using Multicall V3
 */
async function fetchUserPositions(
  blockNumbers: (bigint | "latest")[]
): Promise<UserPosition[]> {
  console.log(`\nFetching positions for blocks: ${blockNumbers.join(", ")}`);

  const calls = blockNumbers.map((blockNumber) => ({
    target: contractAddress as Address,
    allowFailure: false,
    callData: encodeFunctionData({
      abi: contractAbi,
      functionName: "getUserPosition",
      args: [userAddress],
    }),
  }));

  const results = (await client.readContract({
    address: MULTICALL3_ADDRESS,
    abi: MULTICALL3_ABI,
    functionName: "aggregate3",
    args: [calls],
    blockNumber: undefined, // We'll handle this at the multicall level
  })) as MulticallResult;

  console.log(`Successfully fetched ${results.length} positions`);

  return results.map((result) => {
    if (!result.success) {
      throw new Error("Multicall failed for one or more positions");
    }
    // Decode the return data into our UserPosition type
    const decoded = decodeAbiParameters(
      [
        { name: "principal", type: "uint256" },
        { name: "interest", type: "uint256" },
        { name: "fee", type: "uint256" },
        { name: "netWithdrawable", type: "uint256" },
      ],
      result.returnData
    ) as unknown as UserPosition;
    return decoded;
  });
}

async function main() {
  // 1) Estimate block from 24 hours ago
  const block24hAgo = await estimateHistoricalBlock(24);
  console.log(`Using block from 24h ago: ${block24hAgo}`);

  // 2) Read positions from that block vs. latest using multicall
  const positions = await fetchUserPositions([block24hAgo, "latest"]);
  const [pos24hAgo, posLatest] = positions;

  // 3) Print results
  console.log("\n--- Position 24 hours ago ---");
  console.log(`Block Number: ${block24hAgo}`);
  console.log(`Principal:       ${pos24hAgo[0]}`);
  console.log(`Interest:        ${pos24hAgo[1]}`);
  console.log(`Fee:             ${pos24hAgo[2]}`);
  console.log(`Net Withdrawable:${pos24hAgo[3]}`);

  console.log("\n--- Current Position ---");
  console.log(`Block Number: latest`);
  console.log(`Principal:       ${posLatest[0]}`);
  console.log(`Interest:        ${posLatest[1]}`);
  console.log(`Fee:             ${posLatest[2]}`);
  console.log(`Net Withdrawable:${posLatest[3]}`);
}

main()
  .then(() => {
    console.log("\nScript completed successfully.\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
  });
