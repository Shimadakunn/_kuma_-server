import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    `https://arbitrum-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
  ),
});

export { client };
