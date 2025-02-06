import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { fetchTokenBalances } from "./services/tokenBalance";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.post("/api/token-balances", async (req: Request, res: Response) => {
  try {
    const { walletAddress, timeframe } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }
    if (
      !timeframe ||
      !["1H", "1D", "1M", "1Y"].includes(timeframe.toUpperCase())
    ) {
      return res
        .status(400)
        .json({ error: "timeframe must be one of: 1H, 1D, 1M, 1Y" });
    }

    const result = await fetchTokenBalances(walletAddress, timeframe);
    res.json(result);
  } catch (error) {
    console.error("Error in /api/token-balances:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
