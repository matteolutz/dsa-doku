/*
  Warnings:

  - You are about to drop the column `filePath` on the `CourseDocument` table. All the data in the column will be lost.
  - The required column `docId` was added to the `CourseDocument` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "CourseDocument" DROP COLUMN "filePath",
ADD COLUMN     "docId" TEXT NOT NULL;
