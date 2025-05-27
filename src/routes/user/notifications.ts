import express from "express";
import { getUser, validateNotification, validateWallet, prisma } from "~/utils";

const router = express.Router();

router.get("/get/:wallet", validateWallet, async (req, res) => {
  // -- GET USER
  const user = await getUser(req.params.wallet);
  if (!user) return res.status(404).json({ error: "User not found" });

  // -- RETURN USER NOTIFICATIONS
  return res.json(user.notifications);
});

router.get(
  "/set/:wallet/:notification",
  validateWallet,
  validateNotification,
  async (req, res) => {
    // -- GET USER
    const user = await getUser(req.params.wallet);
    if (!user) return res.status(404).json({ error: "User not found" });

    // -- UPDATE USER NOTIFICATIONS
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        notifications: req.params.notification === "true",
      },
    });

    // -- RETURN UPDATED USER NOTIFICATIONS
    return res.json(updatedUser.notifications);
  }
);

export default router;
