-- CreateTable
CREATE TABLE "AcademyAL" (
    "academyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AcademyAL_pkey" PRIMARY KEY ("academyId","userId")
);

-- AddForeignKey
ALTER TABLE "AcademyAL" ADD CONSTRAINT "AcademyAL_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyAL" ADD CONSTRAINT "AcademyAL_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
