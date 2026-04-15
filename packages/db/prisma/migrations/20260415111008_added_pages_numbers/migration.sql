/*
  Warnings:

  - Added the required column `numberOfPages` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalFileName` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "numberOfPages" INTEGER NOT NULL,
ADD COLUMN     "originalFileName" TEXT NOT NULL;
