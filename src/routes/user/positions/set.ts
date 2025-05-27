import { type User } from "@prisma/client";
import { type Address, zeroAddress } from "viem";
import {
  formatValue,
  FACTORY_ABI,
  FACTORY_ADDRESS,
  client,
  emptyUserPosition,
  prisma,
} from "@/utils";

export const setUserPosition = async (user: User) => {
  const wallet = user.wallet as Address;

  // -- GET USER VAULT
  const userVault = await client.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "userVaults",
    args: [wallet],
  });

  // -- CREATE USER POSITION IF USER HAS NO VAULT
  let userPosition;
  if ((userVault as Address) === zeroAddress) {
    userPosition = await prisma.userPosition.create({
      data: emptyUserPosition(user.id, new Date()),
    });
  } else {
    // -- GET USER POSITION
    const position = (await client.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "position",
      args: [wallet],
    })) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

    // -- CREATE USER POSITION
    userPosition = await prisma.userPosition.create({
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        vaultBalance: formatValue(position[0]),
        lastRecordedBalance: formatValue(position[1]),
        pendingYield: formatValue(position[2]),
        pendingFee: formatValue(position[3]),
        userBalance: formatValue(position[4]),
        userPrincipal: formatValue(position[5]),
        totalCollectedFees: formatValue(position[6]),
      },
    });
  }

  return userPosition;
};
