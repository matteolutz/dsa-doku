/*
  Warnings:

  - A unique constraint covering the columns `[location,year]` on the table `Academy` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Academy_location_yearIdx_key";

-- CreateIndex
CREATE UNIQUE INDEX "Academy_location_year_key" ON "Academy"("location", "year");
