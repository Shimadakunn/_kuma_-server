import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function registerMoonpayEvent(data: any) {
  console.log("Received webhook data:", JSON.stringify(data, null, 2));

  if (!data || !data.data) {
    console.error("Invalid webhook data: data field is missing");
    return;
  }

  let responseBody;
  try {
    responseBody = JSON.parse(data.data);
  } catch (e) {
    console.error("Failed to parse webhook data:", e);
    return;
  }

  if (!responseBody.walletAddress) {
    console.error("Invalid responseBody: walletAddress is missing");
    return;
  }

  const { walletAddress, quoteCurrencyAmount, stages } = responseBody;

  console.log(`Processing for walletAddress: ${walletAddress}`);
  const user = await prisma.user.findUnique({
    where: {
      address: walletAddress,
    },
  });

  if (!user) {
    console.log(`User not found`);
    return;
  }

  const deliveryStage = stages.find(
    (s: any) => s.stage === "stage_four_delivery"
  );
  if (deliveryStage?.status === "success") {
    await prisma.userAction.create({
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        action: "DEPOSIT",
        amount: quoteCurrencyAmount.toString(),
        status: "success",
      },
    });
  }
}
