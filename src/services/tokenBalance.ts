import dotenv from "dotenv";
import { Web3 } from "web3";
import { KUMA_VAULT_ABI, MULTICALL3_ABI } from "../config/abi";
dotenv.config();

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const NODE_PROVIDER_URL = "https://arbitrum-sepolia.infura.io/v3";
const API_KEY = process.env.INFURA_API_KEY;
const KUMA_VAULT_ADDRESS = "0xEe086F90EaD471Cb85B84cc770e98b2696257454";

interface MulticallResult {
  0: string;
  1: boolean;
  2: Array<{
    success: boolean;
    returnData: string;
  }>;
}

interface UserPosition {
  blockNumber: number;
  principal: string;
  interest: string;
  fee: string;
  netWithdrawable: string;
  success: boolean;
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
  walletAddress: string,
  timeframe: string
): Promise<{ data: UserPosition[] }> {
  try {
    console.log("Starting fetchTokenBalances with:", {
      walletAddress,
      timeframe,
    });
    const web3 = new Web3(`${NODE_PROVIDER_URL}/${API_KEY}`);
    console.log("Web3 instance created");

    const blockNumbers = await getBlockNumbersForTimeframe(timeframe);
    console.log("Block numbers retrieved:", blockNumbers);

    const multicall = new web3.eth.Contract(
      MULTICALL3_ABI as any,
      MULTICALL3_ADDRESS
    );
    console.log("Multicall contract initialized");

    const kumaVaultContract = new web3.eth.Contract(KUMA_VAULT_ABI as any);
    console.log("KumaVault contract initialized");

    const calls = blockNumbers.map((blockNumber) => ({
      target: KUMA_VAULT_ADDRESS,
      callData: kumaVaultContract.methods
        .getUserPosition(walletAddress)
        .encodeABI(),
      blockNumber: blockNumber.toString(),
    }));
    console.log("Calls prepared:", calls.length);

    const result = (await multicall.methods
      .tryBlockAndAggregate(true, calls)
      .call()) as MulticallResult;
    console.log("Multicall result received");

    const positions: UserPosition[] = result[2].map((item, index) => {
      if (!item.success) {
        console.error(`Failed for block ${blockNumbers[index]}:`, item);
        throw new Error(
          `Failed to fetch data for block ${blockNumbers[index]}`
        );
      }

      // Decode the return data
      const decodedData = web3.eth.abi.decodeParameters(
        ["uint256", "uint256", "uint256", "uint256"],
        item.returnData
      ) as { [key: string]: string };
      console.log(
        `Decoded data for block ${blockNumbers[index]}:`,
        decodedData
      );

      return {
        blockNumber: blockNumbers[index],
        principal: BigInt(decodedData["0"]).toString(),
        interest: BigInt(decodedData["1"]).toString(),
        fee: BigInt(decodedData["2"]).toString(),
        netWithdrawable: BigInt(decodedData["3"]).toString(),
        success: item.success,
      };
    });

    return {
      data: positions,
    };
  } catch (error: any) {
    console.error("Detailed error in fetchTokenBalances:", {
      error,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
