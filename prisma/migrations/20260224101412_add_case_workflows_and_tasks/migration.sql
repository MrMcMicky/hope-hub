/*
  Warnings:

  - Added the required column `offering` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programArea` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('INTAKE', 'ACTIVE', 'FOLLOW_UP', 'WAITLIST', 'CLOSED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProgramArea" AS ENUM ('BEGEGNUNG', 'BETREUEN', 'BEHERBERGEN', 'BESCHAEFTIGEN');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "assignedTeam" TEXT,
ADD COLUMN     "intakeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "offering" TEXT NOT NULL,
ADD COLUMN     "programArea" "ProgramArea" NOT NULL,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'INTAKE';

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "ownerName" TEXT,
    "dueAt" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'P2',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_caseId_status_dueAt_idx" ON "Task"("caseId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE INDEX "Case_programArea_idx" ON "Case"("programArea");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
