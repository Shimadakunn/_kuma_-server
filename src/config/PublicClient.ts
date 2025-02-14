import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    "https://arbitrum-sepolia.infura.io/v3/a78ea67f650a46e8bd97f3262d1cef43"
  ),
});

export { client };
