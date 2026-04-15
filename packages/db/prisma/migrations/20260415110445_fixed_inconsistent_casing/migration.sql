/*
  Warnings:

  - You are about to drop the column `sort_order` on the `Document` table. All the data in the column will be lost.
  - Added the required column `sortOrder` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "sort_order",
ADD COLUMN     "sortOrder" INTEGER NOT NULL;
