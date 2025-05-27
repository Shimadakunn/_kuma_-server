import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

const getRandomApiKey = () => {
  const keys = [process.env.INFURA_API_KEY, process.env.INFURA_API_KEY_2];
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
};

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(`https://arbitrum-sepolia.infura.io/v3/${getRandomApiKey()}`),
});

export { client };
