/*
  Warnings:

  - You are about to drop the `VaultData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VaultData" DROP CONSTRAINT "VaultData_userId_fkey";

-- DropTable
DROP TABLE "VaultData";

-- CreateTable
CREATE TABLE "WalletPosition" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "vaultBalance" TEXT NOT NULL,
    "lastRecordedBalance" TEXT NOT NULL,
    "pendingYield" TEXT NOT NULL,
    "pendingFee" TEXT NOT NULL,
    "userBalance" TEXT NOT NULL,
    "userPrincipal" TEXT NOT NULL,
    "totalCollectedFees" TEXT NOT NULL,

    CONSTRAINT "WalletPosition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WalletPosition" ADD CONSTRAINT "WalletPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
