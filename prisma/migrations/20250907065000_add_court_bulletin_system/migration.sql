-- CreateEnum for court types
CREATE TYPE "CourtType" AS ENUM ('ONSC', 'ONCA', 'ONCJ', 'ONSCDC', 'OLT');

-- CreateEnum for real estate case types
CREATE TYPE "RealEstateCaseType" AS ENUM ('FORECLOSURE', 'POWER_OF_SALE', 'LIEN', 'CONDO', 'RECEIVERSHIP', 'PLANNING', 'OLT_APPEAL', 'ENVIRONMENTAL', 'LABOUR_CONVICTION', 'CONSTRUCTION_LIEN', 'PLANNING_ACT', 'BIA_PROCEEDING');

-- CreateEnum for risk levels
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum for processing types
CREATE TYPE "ProcessingType" AS ENUM ('NER_EXTRACTION', 'CASE_CLASSIFICATION', 'RISK_ASSESSMENT', 'ALERT_GENERATION');

-- CreateEnum for processing status
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable for court cases
CREATE TABLE "court_cases" (
    "id" TEXT NOT NULL,
    "guid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "neutralCitation" TEXT,
    "court" "CourtType" NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "caseUrl" TEXT NOT NULL,
    "summary" TEXT,
    "fullText" TEXT,
    "addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "municipalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "caseTypes" "RealEstateCaseType"[] DEFAULT ARRAY[]::"RealEstateCaseType"[],
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "nerProcessed" BOOLEAN NOT NULL DEFAULT false,
    "classified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable for case processing queue
CREATE TABLE "case_processing_queue" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "processType" "ProcessingType" NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "case_processing_queue_pkey" PRIMARY KEY ("id")
);

-- Add court case reference to alerts table
ALTER TABLE "alerts" ADD COLUMN "courtCaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "court_cases_guid_key" ON "court_cases"("guid");

-- CreateIndex
CREATE INDEX "court_cases_court_publishDate_idx" ON "court_cases"("court", "publishDate");

-- CreateIndex  
CREATE INDEX "court_cases_isProcessed_nerProcessed_idx" ON "court_cases"("isProcessed", "nerProcessed");

-- CreateIndex
CREATE INDEX "case_processing_queue_status_priority_idx" ON "case_processing_queue"("status", "priority");

-- CreateIndex
CREATE INDEX "case_processing_queue_scheduledAt_idx" ON "case_processing_queue"("scheduledAt");

-- AddForeignKey
ALTER TABLE "case_processing_queue" ADD CONSTRAINT "case_processing_queue_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "court_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_courtCaseId_fkey" FOREIGN KEY ("courtCaseId") REFERENCES "court_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;