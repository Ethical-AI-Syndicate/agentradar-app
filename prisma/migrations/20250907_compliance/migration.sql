-- Migration: Add Compliance and Governance Models
-- Date: 2025-09-07
-- Phase 6.4: Compliance and Governance Requirements

-- Compliance Audit Log (Enhanced)
CREATE TABLE "ComplianceAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "auditId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "regulation" TEXT NOT NULL, -- GDPR, SOX, RE_LICENSE, etc.
    "complianceLevel" TEXT NOT NULL DEFAULT 'STANDARD', -- STANDARD, HIGH, CRITICAL
    "dataAccessed" TEXT[], -- Array of data types accessed
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestDetails" JSONB,
    "responseCode" INTEGER,
    "processingTime" INTEGER, -- in milliseconds
    "riskScore" INTEGER DEFAULT 0, -- 0-100 risk assessment
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionDate" TIMESTAMP(3), -- When this record expires

    CONSTRAINT "ComplianceAuditLog_pkey" PRIMARY KEY ("id")
);

-- GDPR Data Subject Requests
CREATE TABLE "GDPRRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL, -- ACCESS, DELETION, PORTABILITY, RECTIFICATION
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, REJECTED
    "reason" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionDate" TIMESTAMP(3),
    "processedBy" TEXT, -- Admin user ID
    "dataExported" BOOLEAN DEFAULT false,
    "exportFormat" TEXT, -- JSON, CSV, etc.
    "exportSize" INTEGER, -- Size in bytes
    "legalBasis" TEXT, -- Legal basis for processing
    "reviewNotes" TEXT,
    "approvalRequired" BOOLEAN DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "GDPRRequest_pkey" PRIMARY KEY ("id")
);

-- SOX Financial Data Access Log
CREATE TABLE "SOXAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL, -- VIEW, CREATE, UPDATE, DELETE, EXPORT
    "resourceType" TEXT NOT NULL, -- BILLING, SUBSCRIPTION, PAYMENT, FINANCIAL_REPORT
    "resourceId" TEXT,
    "financialAmount" DECIMAL(10,2), -- If applicable
    "approvedBy" TEXT, -- Supervisor approval
    "businessJustification" TEXT NOT NULL,
    "sessionId" TEXT,
    "accessDuration" INTEGER, -- in seconds
    "dataModified" BOOLEAN DEFAULT false,
    "backupCreated" BOOLEAN DEFAULT false,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    "complianceFlags" TEXT[], -- Any compliance concerns
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOXAuditLog_pkey" PRIMARY KEY ("id")
);

-- Data Retention Policy Management
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "policyName" TEXT NOT NULL,
    "dataType" TEXT NOT NULL, -- USER_DATA, ACTIVITY_LOGS, FINANCIAL_DATA, etc.
    "retentionPeriodDays" INTEGER NOT NULL,
    "policyDescription" TEXT,
    "legalRequirement" TEXT, -- GDPR, SOX, CCPA, etc.
    "autoDelete" BOOLEAN DEFAULT true,
    "archiveBeforeDelete" BOOLEAN DEFAULT true,
    "archiveLocation" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEnforced" TIMESTAMP(3),
    "nextEnforcement" TIMESTAMP(3),

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- Data Processing Activities (GDPR Article 30)
CREATE TABLE "DataProcessingActivity" (
    "id" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL, -- CONSENT, CONTRACT, LEGAL_OBLIGATION, etc.
    "dataSubjects" TEXT NOT NULL, -- Users, customers, employees, etc.
    "personalDataCategories" TEXT[], -- Email, name, financial, etc.
    "recipients" TEXT[], -- Who receives the data
    "retentionPeriod" TEXT NOT NULL,
    "securityMeasures" TEXT[],
    "transfersOutsideEU" BOOLEAN DEFAULT false,
    "transferSafeguards" TEXT,
    "dataController" TEXT NOT NULL,
    "dataProcessor" TEXT,
    "dpoContact" TEXT,
    "riskAssessment" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "DataProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- Real Estate Compliance Tracking
CREATE TABLE "RealEstateCompliance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL, -- SALES, BROKER, etc.
    "licenseState" TEXT NOT NULL,
    "licenseStatus" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, SUSPENDED
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "verificationDate" TIMESTAMP(3),
    "verificationStatus" TEXT DEFAULT 'PENDING', -- PENDING, VERIFIED, FAILED
    "verificationSource" TEXT, -- Manual, API, etc.
    "complianceFlags" TEXT[], -- Any compliance issues
    "lastCheck" TIMESTAMP(3),
    "nextCheck" TIMESTAMP(3),
    "brokerageName" TEXT,
    "brokerageAddress" TEXT,
    "continuingEducation" JSONB, -- CE requirements
    "disciplinaryActions" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "RealEstateCompliance_pkey" PRIMARY KEY ("id")
);

-- Data Loss Prevention (DLP) Incidents
CREATE TABLE "DLPIncident" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "incidentType" TEXT NOT NULL, -- SENSITIVE_DATA_EXPOSURE, UNAUTHORIZED_ACCESS, etc.
    "severity" TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    "dataType" TEXT NOT NULL, -- SSN, CREDIT_CARD, LICENSE_NUMBER, etc.
    "detectionMethod" TEXT NOT NULL, -- PATTERN_MATCH, ML_DETECTION, etc.
    "location" TEXT NOT NULL, -- API endpoint, database query, etc.
    "originalData" TEXT, -- Redacted original data
    "sanitizedData" TEXT, -- What was actually returned
    "preventionAction" TEXT NOT NULL, -- BLOCKED, REDACTED, LOGGED
    "falsePositive" BOOLEAN DEFAULT false,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DLPIncident_pkey" PRIMARY KEY ("id")
);

-- Privacy Impact Assessment (PIA)
CREATE TABLE "PrivacyImpactAssessment" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectDescription" TEXT NOT NULL,
    "dataProtectionOfficer" TEXT NOT NULL,
    "projectOwner" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personalDataInvolved" TEXT[],
    "dataSubjects" TEXT[],
    "processingPurpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    "riskMitigations" TEXT[],
    "privacyRisks" JSONB,
    "safeguards" TEXT[],
    "consultationRequired" BOOLEAN DEFAULT false,
    "consultationCompleted" BOOLEAN DEFAULT false,
    "approvalStatus" TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "PrivacyImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "ComplianceAuditLog_userId_idx" ON "ComplianceAuditLog"("userId");
CREATE INDEX "ComplianceAuditLog_auditId_idx" ON "ComplianceAuditLog"("auditId");
CREATE INDEX "ComplianceAuditLog_regulation_idx" ON "ComplianceAuditLog"("regulation");
CREATE INDEX "ComplianceAuditLog_createdAt_idx" ON "ComplianceAuditLog"("createdAt");
CREATE INDEX "ComplianceAuditLog_retentionDate_idx" ON "ComplianceAuditLog"("retentionDate");

CREATE INDEX "GDPRRequest_userId_idx" ON "GDPRRequest"("userId");
CREATE INDEX "GDPRRequest_requestType_idx" ON "GDPRRequest"("requestType");
CREATE INDEX "GDPRRequest_status_idx" ON "GDPRRequest"("status");
CREATE INDEX "GDPRRequest_requestDate_idx" ON "GDPRRequest"("requestDate");

CREATE INDEX "SOXAuditLog_userId_idx" ON "SOXAuditLog"("userId");
CREATE INDEX "SOXAuditLog_resourceType_idx" ON "SOXAuditLog"("resourceType");
CREATE INDEX "SOXAuditLog_riskLevel_idx" ON "SOXAuditLog"("riskLevel");
CREATE INDEX "SOXAuditLog_createdAt_idx" ON "SOXAuditLog"("createdAt");

CREATE INDEX "DataRetentionPolicy_dataType_idx" ON "DataRetentionPolicy"("dataType");
CREATE INDEX "DataRetentionPolicy_nextEnforcement_idx" ON "DataRetentionPolicy"("nextEnforcement");
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

CREATE INDEX "DataProcessingActivity_legalBasis_idx" ON "DataProcessingActivity"("legalBasis");
CREATE INDEX "DataProcessingActivity_isActive_idx" ON "DataProcessingActivity"("isActive");
CREATE INDEX "DataProcessingActivity_lastReviewed_idx" ON "DataProcessingActivity"("lastReviewed");

CREATE INDEX "RealEstateCompliance_userId_idx" ON "RealEstateCompliance"("userId");
CREATE INDEX "RealEstateCompliance_licenseNumber_idx" ON "RealEstateCompliance"("licenseNumber");
CREATE INDEX "RealEstateCompliance_licenseStatus_idx" ON "RealEstateCompliance"("licenseStatus");
CREATE INDEX "RealEstateCompliance_expirationDate_idx" ON "RealEstateCompliance"("expirationDate");
CREATE INDEX "RealEstateCompliance_nextCheck_idx" ON "RealEstateCompliance"("nextCheck");

CREATE INDEX "DLPIncident_userId_idx" ON "DLPIncident"("userId");
CREATE INDEX "DLPIncident_severity_idx" ON "DLPIncident"("severity");
CREATE INDEX "DLPIncident_dataType_idx" ON "DLPIncident"("dataType");
CREATE INDEX "DLPIncident_createdAt_idx" ON "DLPIncident"("createdAt");

CREATE INDEX "PrivacyImpactAssessment_riskLevel_idx" ON "PrivacyImpactAssessment"("riskLevel");
CREATE INDEX "PrivacyImpactAssessment_approvalStatus_idx" ON "PrivacyImpactAssessment"("approvalStatus");
CREATE INDEX "PrivacyImpactAssessment_reviewDate_idx" ON "PrivacyImpactAssessment"("reviewDate");

-- Add foreign key constraints
ALTER TABLE "ComplianceAuditLog" ADD CONSTRAINT "ComplianceAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GDPRRequest" ADD CONSTRAINT "GDPRRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SOXAuditLog" ADD CONSTRAINT "SOXAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RealEstateCompliance" ADD CONSTRAINT "RealEstateCompliance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DLPIncident" ADD CONSTRAINT "DLPIncident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;