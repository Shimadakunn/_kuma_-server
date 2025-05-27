import express from "express";
import { validateEmail, prisma } from "~/utils";

const waitingList = express.Router();

waitingList.get("/:email", validateEmail, async (req, res) => {
  // -- GET EMAIL
  const email = req.params.email;

  // -- GET WAITING LIST
  const waitingList = await prisma.waitingList.findFirst({
    where: { email },
  });
  if (waitingList)
    return res.status(400).json({ error: "Email already in waiting list" });

  // -- CREATE NEW WAITING LIST
  const newWaitingList = await prisma.waitingList.create({
    data: { email },
  });
  return res.json(newWaitingList);
});

export default waitingList;
