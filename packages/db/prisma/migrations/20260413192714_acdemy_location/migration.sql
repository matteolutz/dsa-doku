/*
  Warnings:

  - You are about to drop the column `name` on the `Academy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[location,yearIdx]` on the table `Academy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location` to the `Academy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Academy" DROP COLUMN "name",
ADD COLUMN     "location" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Academy_location_yearIdx_key" ON "Academy"("location", "yearIdx");
