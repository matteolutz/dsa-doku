/*
  Warnings:

  - You are about to drop the column `numberOfPages` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `originalFileName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `startingPageNumber` on the `Document` table. All the data in the column will be lost.
  - Added the required column `meta` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "numberOfPages",
DROP COLUMN "originalFileName",
DROP COLUMN "startingPageNumber",
ADD COLUMN     "meta" JSONB NOT NULL;
