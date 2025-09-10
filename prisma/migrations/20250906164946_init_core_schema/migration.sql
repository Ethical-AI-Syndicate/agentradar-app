-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('FREE', 'SOLO_AGENT', 'PROFESSIONAL', 'TEAM_ENTERPRISE', 'WHITE_LABEL');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('POWER_OF_SALE', 'ESTATE_SALE', 'DEVELOPMENT_APPLICATION', 'MUNICIPAL_PERMIT', 'PROBATE_FILING', 'TAX_SALE');

-- CreateEnum
CREATE TYPE "public"."DataSource" AS ENUM ('ONTARIO_COURT_BULLETINS', 'ESTATE_FILINGS', 'MUNICIPAL_APPLICATIONS', 'DEVELOPMENT_PERMITS', 'TAX_OFFICE', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'ALERT_VIEWED', 'ALERT_BOOKMARKED', 'PROPERTY_SAVED', 'SEARCH_PERFORMED', 'PREFERENCES_UPDATED', 'SUBSCRIPTION_CHANGED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "company" TEXT,
    "location" TEXT,
    "teamSize" TEXT,
    "monthlyDeals" TEXT,
    "primaryFocus" TEXT,
    "techComfort" TEXT,
    "currentChallenges" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'ON',
    "postalCode" TEXT,
    "alertType" "public"."AlertType" NOT NULL,
    "source" "public"."DataSource" NOT NULL,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "opportunityScore" INTEGER NOT NULL DEFAULT 0,
    "timelineMonths" INTEGER,
    "propertyType" TEXT,
    "estimatedValue" INTEGER,
    "lotSize" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "courtFileNumber" TEXT,
    "courtDate" TIMESTAMP(3),
    "probateNumber" TEXT,
    "executorName" TEXT,
    "executorContact" TEXT,
    "applicationNumber" TEXT,
    "municipalOffice" TEXT,
    "applicationDate" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alert_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 50,
    "propertyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minValue" INTEGER,
    "maxValue" INTEGER,
    "minBedrooms" INTEGER,
    "maxBedrooms" INTEGER,
    "alertTypes" "public"."AlertType"[],
    "minPriority" "public"."Priority" NOT NULL DEFAULT 'LOW',
    "minOpportunityScore" INTEGER NOT NULL DEFAULT 0,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "maxAlertsPerDay" INTEGER NOT NULL DEFAULT 10,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saved_properties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."ActivityType" NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."early_adopter_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "monthlyDeals" TEXT NOT NULL,
    "primaryFocus" TEXT NOT NULL,
    "currentChallenges" TEXT[],
    "techComfort" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT,
    "discountPercent" INTEGER NOT NULL DEFAULT 50,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "early_adopter_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "public"."users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscriptionId_key" ON "public"."users"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_alerts_userId_alertId_key" ON "public"."user_alerts"("userId", "alertId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_preferences_userId_key" ON "public"."alert_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_userId_alertId_key" ON "public"."saved_properties"("userId", "alertId");

-- CreateIndex
CREATE UNIQUE INDEX "early_adopter_tokens_token_key" ON "public"."early_adopter_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "early_adopter_tokens_email_key" ON "public"."early_adopter_tokens"("email");

-- CreateIndex
CREATE UNIQUE INDEX "early_adopter_tokens_userId_key" ON "public"."early_adopter_tokens"("userId");

-- AddForeignKey
ALTER TABLE "public"."user_alerts" ADD CONSTRAINT "user_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_alerts" ADD CONSTRAINT "user_alerts_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alert_preferences" ADD CONSTRAINT "alert_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_properties" ADD CONSTRAINT "saved_properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
