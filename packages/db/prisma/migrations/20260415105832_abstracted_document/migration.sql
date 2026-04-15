/*
  Warnings:

  - You are about to drop the `CourseDocument` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('AL_PREFACE', 'KUMU', 'COURSE', 'KUA');

-- DropForeignKey
ALTER TABLE "CourseDocument" DROP CONSTRAINT "CourseDocument_courseId_fkey";

-- DropTable
DROP TABLE "CourseDocument";

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "academyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "courseId" INTEGER,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
