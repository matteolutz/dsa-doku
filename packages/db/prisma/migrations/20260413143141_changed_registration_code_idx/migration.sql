/*
  Warnings:

  - The primary key for the `RegistrationCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RegistrationCode` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `RegistrationCode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RegistrationCode" DROP CONSTRAINT "RegistrationCode_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "RegistrationCode_pkey" PRIMARY KEY ("code");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCode_code_key" ON "RegistrationCode"("code");
