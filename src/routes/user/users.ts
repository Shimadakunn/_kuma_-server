import express from "express";
import { validateWallet, validateEmail, getUser, prisma } from "../../../utils";

const router = express.Router();

router.get(
  "/set/:wallet/:email",
  validateWallet,
  validateEmail,
  async (req, res) => {
    // -- GET USER
    const existingUser = await getUser(req.params.wallet);

    // -- UPDATE USER LAST CONNECTED AT AND STOP
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { lastConnectedAt: new Date() },
      });
      return res.json(existingUser);
    }

    // -- CREATE USER
    const user = await prisma.user.create({
      data: {
        wallet: req.params.wallet,
        email: req.params.email,
      },
    });

    // -- CREATE USER POSITION
    await prisma.userPosition.create({
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        vaultBalance: "0",
        lastRecordedBalance: "0",
        pendingYield: "0",
        pendingFee: "0",
        userBalance: "0",
        userPrincipal: "0",
        totalCollectedFees: "0",
      },
    });

    return res.json(user);
  }
);

export default router;
