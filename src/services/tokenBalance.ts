import dotenv from "dotenv";
import { Web3 } from "web3";

dotenv.config();

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const NODE_PROVIDER_URL = "https://mainnet.infura.io/v3";
const API_KEY = process.env.INFURA_API_KEY;

const MULTICALL3_ABI = [
  {
    inputs: [
      { internalType: "bool", name: "requireSuccess", type: "bool" },
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "tryBlockAndAggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bool", name: "blockSuccess", type: "bool" },
      {
        components: [
          { internalType: "bool", name: "success", type: "bool" },
          { internalType: "bytes", name: "returnData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Result[]",
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
];

interface MulticallResult {
  0: string;
  1: boolean;
  2: Array<{
    success: boolean;
    returnData: string;
  }>;
}

async function getBlockNumbersForTimeframe(
  timeframe: string
): Promise<number[]> {
  const web3 = new Web3(`${NODE_PROVIDER_URL}/${API_KEY}`);
  console.log("Node Provider URL", NODE_PROVIDER_URL);
  const currentBlock = await web3.eth.getBlockNumber();
  const blocksPerDay = 7200;
  console.log("Current Block", currentBlock);
  let blockDifference: number;
  switch (timeframe.toUpperCase()) {
    case "1H":
      blockDifference = 300;
      break;
    case "1D":
      blockDifference = blocksPerDay;
      break;
    case "1M":
      blockDifference = blocksPerDay * 30;
      break;
    case "1Y":
      blockDifference = blocksPerDay * 365;
      break;
    default:
      throw new Error("Invalid timeframe. Supported values: 1H, 1D, 1M, 1Y");
  }

  const startBlock = Number(currentBlock) - blockDifference;
  const blockStep = Math.floor(blockDifference / 9); // 9 intervals for 10 points

  // Generate 10 evenly distributed block numbers
  const blockNumbers = Array.from(
    { length: 10 },
    (_, i) => startBlock + blockStep * i
  );

  return blockNumbers;
}

export async function fetchTokenBalances(
  walletAddresses: string[],
  tokenAddresses: string[],
  timeframe: string
): Promise<any> {
  const web3 = new Web3(`${NODE_PROVIDER_URL}/${API_KEY}`);
  const blockNumbers = await getBlockNumbersForTimeframe(timeframe);

  const multicall = new web3.eth.Contract(
    MULTICALL3_ABI as any,
    MULTICALL3_ADDRESS
  );
  const erc20Contract = new web3.eth.Contract(ERC20_ABI as any);

  const calls = [];
  for (const blockNumber of blockNumbers) {
    for (const walletAddress of walletAddresses) {
      for (const tokenAddress of tokenAddresses) {
        const callData = erc20Contract.methods
          .balanceOf(walletAddress)
          .encodeABI();
        calls.push({
          target: tokenAddress,
          callData,
        });
      }
    }
  }

  try {
    const result = (await multicall.methods
      .tryBlockAndAggregate(false, calls)
      .call()) as MulticallResult;

    const balances = result[2].map((item: any, index: number) => {
      const blockIndex = Math.floor(
        index / (walletAddresses.length * tokenAddresses.length)
      );
      const walletIndex = Math.floor(
        (index % (walletAddresses.length * tokenAddresses.length)) /
          tokenAddresses.length
      );
      const tokenIndex = index % tokenAddresses.length;

      return {
        blockNumber: blockNumbers[blockIndex],
        walletAddress: walletAddresses[walletIndex],
        tokenAddress: tokenAddresses[tokenIndex],
        balance: web3.utils.hexToNumberString(item.returnData),
        success: item.success,
      };
    });

    return {
      timeframe,
      data: balances,
    };
  } catch (error) {
    console.error("Error fetching token balances:", error);
    throw error;
  }
}
