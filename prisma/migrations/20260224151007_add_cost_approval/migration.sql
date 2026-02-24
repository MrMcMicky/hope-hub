-- CreateEnum
CREATE TYPE "CostApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "InvoiceLineSource" ADD VALUE 'COST_APPROVAL';

-- AlterTable
ALTER TABLE "InvoiceDraft" ADD COLUMN     "costApprovalId" TEXT;

-- CreateTable
CREATE TABLE "CostApproval" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "approvalRef" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "approvedAmountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "CostApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CostApproval_approvalRef_key" ON "CostApproval"("approvalRef");

-- CreateIndex
CREATE INDEX "CostApproval_caseId_status_validUntil_idx" ON "CostApproval"("caseId", "status", "validUntil");

-- CreateIndex
CREATE INDEX "InvoiceDraft_costApprovalId_idx" ON "InvoiceDraft"("costApprovalId");

-- AddForeignKey
ALTER TABLE "InvoiceDraft" ADD CONSTRAINT "InvoiceDraft_costApprovalId_fkey" FOREIGN KEY ("costApprovalId") REFERENCES "CostApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostApproval" ADD CONSTRAINT "CostApproval_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostApproval" ADD CONSTRAINT "CostApproval_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
