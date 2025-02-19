import express, { NextFunction } from "express";
import { Timeframe } from "./config/BlocksTime";
import { getCurrentBalance, getPositions } from "./endpoints";

const app = express();
const port = process.env.PORT || 3000;

// Middleware to validate timeframe
const validateTimeframe = (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const timeframe = req.params.timeframe.toUpperCase();
  if (!Object.values(Timeframe).includes(timeframe as Timeframe)) {
    return res.status(400).json({
      error: "Invalid timeframe",
      validTimeframes: Object.values(Timeframe),
    });
  }
  next();
};

// Middleware to validate wallet address
const validateWalletAddress = (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  const walletAddress = req.params.walletAddress;
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address format" });
  }
  next();
};

// GET endpoint for current balance
app.get(
  "/balance/:walletAddress",
  validateWalletAddress,
  async (req: express.Request, res: express.Response) => {
    try {
      const { walletAddress } = req.params;
      const balance = await getCurrentBalance(walletAddress as `0x${string}`);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET endpoint for positions
app.get(
  "/positions/:walletAddress/:timeframe/:precision?",
  validateWalletAddress,
  validateTimeframe,
  async (req: express.Request, res: express.Response) => {
    try {
      const { walletAddress, timeframe } = req.params;
      const precision = parseInt(req.params.precision) || 10; // Default to 20 if not specified

      if (precision < 1 || precision > 100) {
        return res
          .status(400)
          .json({ error: "Precision must be between 1 and 100" });
      }

      const positions = await getPositions(
        walletAddress as `0x${string}`,
        timeframe.toUpperCase() as Timeframe,
        precision
      );

      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "healthy" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
