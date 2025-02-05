import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { fetchTokenBalances } from "./services/tokenBalance";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/hello", (req: Request, res: Response) => {
  console.log("Hello, TypeScript Express!");
  res.json({ message: "Hello, TypeScript Express!" });
});

app.post("/api/message", (req: Request, res: Response) => {
  const { message } = req.body;
  res.json({
    received: message,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/token-balances", async (req: Request, res: Response) => {
  try {
    const { walletAddresses, tokenAddresses, timeframe } = req.body;

    if (
      !walletAddresses ||
      !Array.isArray(walletAddresses) ||
      walletAddresses.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "walletAddresses must be a non-empty array" });
    }
    if (
      !tokenAddresses ||
      !Array.isArray(tokenAddresses) ||
      tokenAddresses.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "tokenAddresses must be a non-empty array" });
    }
    if (
      !timeframe ||
      !["1H", "1D", "1M", "1Y"].includes(timeframe.toUpperCase())
    ) {
      return res
        .status(400)
        .json({ error: "timeframe must be one of: 1H, 1D, 1M, 1Y" });
    }

    const result = await fetchTokenBalances(
      walletAddresses,
      tokenAddresses,
      timeframe
    );
    res.json(result);
  } catch (error) {
    console.error("Error in /api/token-balances:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
