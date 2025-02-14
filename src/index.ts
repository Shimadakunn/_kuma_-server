import { Timeframe } from "./config/BlocksTime";
import { getPositions } from "./getPositions";

const exampleWallet = "0xb3a60b7e3e0cD790a3a6cc1c59627B70e350eea1" as const;

async function main() {
  const positions = await getPositions(exampleWallet, Timeframe.H, 5);
  console.log(positions);
}

main().catch(console.error);
// getOwner(Timeframe.H, 5);
