import crypto from "crypto";
import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  // -- GET URL
  const { url } = req.body;
  if (!url)
    return res.status(400).json({ error: "URL is required in request body" });

  console.log("url", url);

  const signature = crypto
    .createHmac("sha256", process.env.MOONPAY_API_KEY || "")
    .update(new URL(url).search)
    .digest("base64");

  console.log("signature", signature);
  return res.json({ signature });
});

export default router;
