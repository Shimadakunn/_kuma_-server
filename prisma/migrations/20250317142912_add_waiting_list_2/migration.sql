/*
  Warnings:

  - You are about to drop the column `address` on the `WaitingList` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `WaitingList` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `WaitingList` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WaitingList_address_key";

-- AlterTable
ALTER TABLE "WaitingList" DROP COLUMN "address",
ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_email_key" ON "WaitingList"("email");
