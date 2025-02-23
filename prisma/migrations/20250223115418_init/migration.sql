-- CreateEnum
CREATE TYPE "Action" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConnectedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultData" (
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

    CONSTRAINT "VaultData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "WalletAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "VaultData" ADD CONSTRAINT "VaultData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAction" ADD CONSTRAINT "WalletAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
