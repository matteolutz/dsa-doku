/*
  Warnings:

  - The primary key for the `RegistrationCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[year,yearIdx]` on the table `Academy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `Academy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Academy" ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RegistrationCode" DROP CONSTRAINT "RegistrationCode_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "Academy_year_yearIdx_key" ON "Academy"("year", "yearIdx");
