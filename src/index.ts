import express from "express";
import * as endpoints from "./endpoints";
import * as middleware from "./middleware";
import { Action } from "@prisma/client";
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Apply API key validation to all routes
app.use(middleware.validateApiKey);

// ==== GET ====

// Get user positions
app.get(
  "/get-user-positions/:walletAddress/:timeframe",
  middleware.validateWalletAddress,
  middleware.validateTimeframe,
  async (req: express.Request, res: express.Response) => {
    try {
      const { walletAddress, timeframe } = req.params;
      const positions = await endpoints.getUserPositions(
        walletAddress,
        timeframe as "H" | "D" | "M" | "Y"
      );

      if (!positions) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(positions);
    } catch (error) {
      console.error("Error fetching user positions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user actions
app.get(
  "/get-user-actions/:walletAddress",
  middleware.validateWalletAddress,
  async (req: express.Request, res: express.Response) => {
    try {
      const { walletAddress } = req.params;
      const actionData = await endpoints.getUserActions(walletAddress);

      if (!actionData) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(actionData);
    } catch (error) {
      console.error("Error fetching user actions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ==== POST ====

// Register user
app.get(
  "/register-user/:walletAddress/:email",
  middleware.validateWalletAddress,
  middleware.validateEmail,
  async (req: express.Request, res: express.Response) => {
    try {
      const { walletAddress, email } = req.params;
      const user = await endpoints.registerUser(
        walletAddress as `0x${string}`,
        email
      );
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error registering user:", error);
      if (error.code === "P2002") {
        // Prisma unique constraint violation error
        return res
          .status(409)
          .json({ error: "User with this address or email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Register user position
app.get(
  "/register-user-position/:walletAddress",
  middleware.validateWalletAddress,
  async (req: express.Request, res: express.Response) => {
    const { walletAddress } = req.params;
    const position = await endpoints.registerUserPosition(walletAddress);
    res.json(position);
  }
);

// Register user action
app.get(
  "/register-user-action/:walletAddress/:action/:amount",
  middleware.validateWalletAddress,
  middleware.validateAction,
  middleware.validateAmount,
  async (req: express.Request, res: express.Response) => {
    const { walletAddress, action, amount } = req.params;
    const actionData = await endpoints.registerUserAction(
      walletAddress,
      action as Action,
      amount
    );
    res.json(actionData);
  }
);

// Register all users positions
app.get(
  "/register-all-users-position",
  async (req: express.Request, res: express.Response) => {
    try {
      const result = await endpoints.registerAllUsersPosition();
      res.json(result);
    } catch (error) {
      console.error("Error registering all users positions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Register all users rewards
app.get(
  "/register-all-users-rewards",
  async (req: express.Request, res: express.Response) => {
    try {
      const result = await endpoints.registerAllUsersRewards();
      res.json(result);
    } catch (error) {
      console.error("Error registering rewards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
