import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { event } = req.body;
  console.log("event", event);
  return res.json({ message: "Event received", event });
});

export default router;
