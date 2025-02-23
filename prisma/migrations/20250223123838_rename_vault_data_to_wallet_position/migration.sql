/*
  Warnings:

  - You are about to drop the `WalletAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletPosition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WalletAction" DROP CONSTRAINT "WalletAction_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletPosition" DROP CONSTRAINT "WalletPosition_userId_fkey";

-- DropTable
DROP TABLE "WalletAction";

-- DropTable
DROP TABLE "WalletPosition";

-- CreateTable
CREATE TABLE "UserPosition" (
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

    CONSTRAINT "UserPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "UserAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPosition" ADD CONSTRAINT "UserPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAction" ADD CONSTRAINT "UserAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
