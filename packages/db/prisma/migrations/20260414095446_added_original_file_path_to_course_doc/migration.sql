/*
  Warnings:

  - Added the required column `originalFileName` to the `CourseDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CourseDocument" ADD COLUMN     "originalFileName" TEXT NOT NULL;
