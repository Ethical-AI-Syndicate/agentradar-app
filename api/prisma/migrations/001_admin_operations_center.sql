-- Migration: Admin Operations Center
-- Add comprehensive admin and support system tables

-- Support Tickets Table (enhanced)
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'technical',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL DEFAULT 'email',
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "assignedToId" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3),
    "metadata" JSONB,
    "tags" TEXT[],
    "internalNotes" TEXT,
    "satisfaction" INTEGER,
    "satisfactionFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- Ticket Responses Table
CREATE TABLE IF NOT EXISTS "TicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketResponse_pkey" PRIMARY KEY ("id")
);

-- Ticket Activity Log
CREATE TABLE IF NOT EXISTS "TicketActivity" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS "KnowledgeBaseArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseArticle_pkey" PRIMARY KEY ("id")
);

-- Canned Responses
CREATE TABLE IF NOT EXISTS "CannedResponse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CannedResponse_pkey" PRIMARY KEY ("id")
);

-- Admin Actions Audit Log
CREATE TABLE IF NOT EXISTS "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- Business Analytics Cache
CREATE TABLE IF NOT EXISTS "AnalyticsCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsCache_pkey" PRIMARY KEY ("id")
);

-- System Alerts
CREATE TABLE IF NOT EXISTS "SystemAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- Content Management - Blog Posts
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "featuredImage" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- Content Management - Pages
CREATE TABLE IF NOT EXISTS "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "template" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- Email Templates
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "templateId" TEXT,
    "segmentCriteria" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipientCount" INTEGER,
    "deliveredCount" INTEGER,
    "openedCount" INTEGER,
    "clickedCount" INTEGER,
    "bouncedCount" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- Team Management
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- User Team Membership
CREATE TABLE IF NOT EXISTS "UserTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "permissions" TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "SupportTicket_customerId_idx" ON "SupportTicket"("customerId");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX IF NOT EXISTS "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX IF NOT EXISTS "SupportTicket_slaDeadline_idx" ON "SupportTicket"("slaDeadline");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

CREATE INDEX IF NOT EXISTS "TicketResponse_ticketId_idx" ON "TicketResponse"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketResponse_authorId_idx" ON "TicketResponse"("authorId");
CREATE INDEX IF NOT EXISTS "TicketResponse_createdAt_idx" ON "TicketResponse"("createdAt");

CREATE INDEX IF NOT EXISTS "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketActivity_timestamp_idx" ON "TicketActivity"("timestamp");

CREATE INDEX IF NOT EXISTS "AdminAction_adminId_idx" ON "AdminAction"("adminId");
CREATE INDEX IF NOT EXISTS "AdminAction_timestamp_idx" ON "AdminAction"("timestamp");
CREATE INDEX IF NOT EXISTS "AdminAction_action_idx" ON "AdminAction"("action");

CREATE INDEX IF NOT EXISTS "KnowledgeBaseArticle_category_idx" ON "KnowledgeBaseArticle"("category");
CREATE INDEX IF NOT EXISTS "KnowledgeBaseArticle_published_idx" ON "KnowledgeBaseArticle"("published");
CREATE INDEX IF NOT EXISTS "KnowledgeBaseArticle_viewCount_idx" ON "KnowledgeBaseArticle"("viewCount");

CREATE INDEX IF NOT EXISTS "BlogPost_published_idx" ON "BlogPost"("published");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");
CREATE INDEX IF NOT EXISTS "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

CREATE INDEX IF NOT EXISTS "EmailCampaign_status_idx" ON "EmailCampaign"("status");
CREATE INDEX IF NOT EXISTS "EmailCampaign_scheduledAt_idx" ON "EmailCampaign"("scheduledAt");
CREATE INDEX IF NOT EXISTS "EmailCampaign_createdBy_idx" ON "EmailCampaign"("createdBy");

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsCache_key_key" ON "AnalyticsCache"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "UserTeam_userId_teamId_key" ON "UserTeam"("userId", "teamId");

-- Foreign Key Constraints
-- Note: These would be added after ensuring the referenced tables exist
-- ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;