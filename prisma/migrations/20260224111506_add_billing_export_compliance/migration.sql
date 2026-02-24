-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceLineSource" AS ENUM ('STAY', 'SERVICE_EVENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExportPackageStatus" AS ENUM ('DRAFT', 'READY', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RetentionStatus" AS ENUM ('ACTIVE', 'DUE', 'ARCHIVED', 'DELETION_SCHEDULED');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "retentionDueAt" TIMESTAMP(3),
ADD COLUMN     "retentionLastCheck" TIMESTAMP(3),
ADD COLUMN     "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "scheduledDeletionAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "InvoiceDraft" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "invoiceRef" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceDraftId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sourceType" "InvoiceLineSource" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportRecipient" (
    "id" TEXT NOT NULL,
    "recipientRef" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "organisation" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'sftp',
    "endpoint" TEXT,
    "authorityApproved" BOOLEAN NOT NULL DEFAULT false,
    "keyFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportPackage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "exportRef" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "ExportPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "payloadType" TEXT NOT NULL DEFAULT 'case_bundle',
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "purpose" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "sharePolicy" "SharePolicy" NOT NULL,
    "payloadHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceDraft_invoiceRef_key" ON "InvoiceDraft"("invoiceRef");

-- CreateIndex
CREATE INDEX "InvoiceDraft_caseId_status_updatedAt_idx" ON "InvoiceDraft"("caseId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceDraftId_createdAt_idx" ON "InvoiceLine"("invoiceDraftId", "createdAt");

-- CreateIndex
CREATE INDEX "InvoiceLine_caseId_sourceType_idx" ON "InvoiceLine"("caseId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ExportRecipient_recipientRef_key" ON "ExportRecipient"("recipientRef");

-- CreateIndex
CREATE INDEX "ExportRecipient_authorityApproved_idx" ON "ExportRecipient"("authorityApproved");

-- CreateIndex
CREATE UNIQUE INDEX "ExportPackage_exportRef_key" ON "ExportPackage"("exportRef");

-- CreateIndex
CREATE INDEX "ExportPackage_caseId_status_updatedAt_idx" ON "ExportPackage"("caseId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ExportPackage_recipientId_status_idx" ON "ExportPackage"("recipientId", "status");

-- CreateIndex
CREATE INDEX "Case_retentionStatus_idx" ON "Case"("retentionStatus");

-- CreateIndex
CREATE INDEX "Case_retentionDueAt_idx" ON "Case"("retentionDueAt");

-- CreateIndex
CREATE INDEX "Case_scheduledDeletionAt_idx" ON "Case"("scheduledDeletionAt");

-- AddForeignKey
ALTER TABLE "InvoiceDraft" ADD CONSTRAINT "InvoiceDraft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDraft" ADD CONSTRAINT "InvoiceDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceDraftId_fkey" FOREIGN KEY ("invoiceDraftId") REFERENCES "InvoiceDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "ExportRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportPackage" ADD CONSTRAINT "ExportPackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
