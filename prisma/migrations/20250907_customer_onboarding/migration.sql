-- =====================================================================
-- Customer Onboarding Automation Schema - Phase 6.3 Enterprise
-- Comprehensive brokerage client onboarding and management system
-- =====================================================================

-- Brokerage Client Management
CREATE TABLE IF NOT EXISTS "BrokerageClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT UNIQUE NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "billingEmail" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'US',
    "licenseNumber" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'PROFESSIONAL',
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "onboardingProgress" INTEGER NOT NULL DEFAULT 0,
    "customizations" JSONB DEFAULT '{}',
    "settings" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialStartDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "subscriptionStartDate" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerageClient_pkey" PRIMARY KEY ("id")
);

-- Onboarding Workflow Steps
CREATE TABLE IF NOT EXISTS "OnboardingStep" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "estimatedDuration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "data" JSONB DEFAULT '{}',
    "validationRules" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OnboardingStep_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Customer Success Metrics
CREATE TABLE IF NOT EXISTS "CustomerSuccessMetric" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "period" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "CustomerSuccessMetric_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerSuccessMetric_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Customer Support Tickets (Enhanced)
CREATE TABLE IF NOT EXISTS "CustomerSupportTicket" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT,
    "userId" TEXT,
    "ticketNumber" TEXT UNIQUE NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolutionNotes" TEXT,
    "customerSatisfactionScore" INTEGER,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSupportTicket_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerSupportTicket_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerSupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Customer Onboarding Templates
CREATE TABLE IF NOT EXISTS "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "customizations" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- Customer Communication Log
CREATE TABLE IF NOT EXISTS "CustomerCommunication" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT NOT NULL,
    "communicationType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCommunication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerCommunication_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- White Label Configuration
CREATE TABLE IF NOT EXISTS "WhiteLabelConfig" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "customDomain" TEXT,
    "emailTemplate" JSONB DEFAULT '{}',
    "dashboardConfig" JSONB DEFAULT '{}',
    "featureFlags" JSONB DEFAULT '{}',
    "customCss" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WhiteLabelConfig_brokerageClientId_key" UNIQUE ("brokerageClientId"),
    CONSTRAINT "WhiteLabelConfig_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Customer Health Score
CREATE TABLE IF NOT EXISTS "CustomerHealthScore" (
    "id" TEXT NOT NULL,
    "brokerageClientId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "adoptionScore" INTEGER NOT NULL,
    "engagementScore" INTEGER NOT NULL,
    "supportScore" INTEGER NOT NULL,
    "billingScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "factors" JSONB DEFAULT '{}',
    "recommendations" JSONB DEFAULT '[]',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "CustomerHealthScore_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerHealthScore_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Automated Workflows
CREATE TABLE IF NOT EXISTS "AutomatedWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConditions" JSONB NOT NULL DEFAULT '{}',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomatedWorkflow_pkey" PRIMARY KEY ("id")
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "brokerageClientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "triggerData" JSONB DEFAULT '{}',
    "executionLog" JSONB DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomatedWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowExecution_brokerageClientId_fkey" FOREIGN KEY ("brokerageClientId") REFERENCES "BrokerageClient"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "BrokerageClient_domain_idx" ON "BrokerageClient"("domain");
CREATE INDEX IF NOT EXISTS "BrokerageClient_onboardingStatus_idx" ON "BrokerageClient"("onboardingStatus");
CREATE INDEX IF NOT EXISTS "BrokerageClient_subscriptionTier_idx" ON "BrokerageClient"("subscriptionTier");
CREATE INDEX IF NOT EXISTS "BrokerageClient_isActive_idx" ON "BrokerageClient"("isActive");
CREATE INDEX IF NOT EXISTS "BrokerageClient_createdAt_idx" ON "BrokerageClient"("createdAt");

CREATE INDEX IF NOT EXISTS "OnboardingStep_brokerageClientId_idx" ON "OnboardingStep"("brokerageClientId");
CREATE INDEX IF NOT EXISTS "OnboardingStep_status_idx" ON "OnboardingStep"("status");
CREATE INDEX IF NOT EXISTS "OnboardingStep_stepOrder_idx" ON "OnboardingStep"("stepOrder");

CREATE INDEX IF NOT EXISTS "CustomerSuccessMetric_brokerageClientId_idx" ON "CustomerSuccessMetric"("brokerageClientId");
CREATE INDEX IF NOT EXISTS "CustomerSuccessMetric_metricType_idx" ON "CustomerSuccessMetric"("metricType");
CREATE INDEX IF NOT EXISTS "CustomerSuccessMetric_recordedAt_idx" ON "CustomerSuccessMetric"("recordedAt");

CREATE INDEX IF NOT EXISTS "CustomerSupportTicket_brokerageClientId_idx" ON "CustomerSupportTicket"("brokerageClientId");
CREATE INDEX IF NOT EXISTS "CustomerSupportTicket_status_idx" ON "CustomerSupportTicket"("status");
CREATE INDEX IF NOT EXISTS "CustomerSupportTicket_priority_idx" ON "CustomerSupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "CustomerSupportTicket_ticketNumber_idx" ON "CustomerSupportTicket"("ticketNumber");

CREATE INDEX IF NOT EXISTS "CustomerCommunication_brokerageClientId_idx" ON "CustomerCommunication"("brokerageClientId");
CREATE INDEX IF NOT EXISTS "CustomerCommunication_status_idx" ON "CustomerCommunication"("status");
CREATE INDEX IF NOT EXISTS "CustomerCommunication_communicationType_idx" ON "CustomerCommunication"("communicationType");

CREATE INDEX IF NOT EXISTS "CustomerHealthScore_brokerageClientId_idx" ON "CustomerHealthScore"("brokerageClientId");
CREATE INDEX IF NOT EXISTS "CustomerHealthScore_overallScore_idx" ON "CustomerHealthScore"("overallScore");
CREATE INDEX IF NOT EXISTS "CustomerHealthScore_riskLevel_idx" ON "CustomerHealthScore"("riskLevel");

CREATE INDEX IF NOT EXISTS "AutomatedWorkflow_triggerType_idx" ON "AutomatedWorkflow"("triggerType");
CREATE INDEX IF NOT EXISTS "AutomatedWorkflow_isActive_idx" ON "AutomatedWorkflow"("isActive");

CREATE INDEX IF NOT EXISTS "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
CREATE INDEX IF NOT EXISTS "WorkflowExecution_startedAt_idx" ON "WorkflowExecution"("startedAt");