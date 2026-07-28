/*
  Warnings:

  - A unique constraint covering the columns `[academyId,courseIdx]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Course_academyId_courseIdx_key" ON "Course"("academyId", "courseIdx");
