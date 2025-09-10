import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Simple auth check
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting database initialization...");

    // Generate Prisma client to ensure all tables exist
    await prisma.$executeRaw`SELECT 1`;

    // Create admin user if not exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    let adminUser;
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123!", 10);
      adminUser = await prisma.user.create({
        data: {
          email: "admin@agentradar.app",
          firstName: "Admin",
          lastName: "User",
          password: hashedPassword,
          role: "ADMIN",
          subscriptionTier: "TEAM_ENTERPRISE",
          isActive: true,
        },
      });
      console.log("Created admin user");
    } else {
      adminUser = existingAdmin;
      console.log("Admin user already exists");
    }

    // Create products if they don't exist
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      await prisma.product.createMany({
        data: [
          {
            name: "Solo Agent",
            description: "Perfect for individual real estate agents",
            stripePriceId: "price_solo_agent",
            price: 197.0,
            currency: "cad",
            interval: "month",
            tier: "SOLO_AGENT",
            features: [
              "Up to 100 alerts/month",
              "Email notifications",
              "Basic analytics",
            ],
            maxAlerts: 100,
            maxUsers: 1,
            isActive: true,
            displayOrder: 1,
          },
          {
            name: "Professional Team",
            description: "For growing real estate teams",
            stripePriceId: "price_professional_team",
            price: 497.0,
            currency: "cad",
            interval: "month",
            tier: "PROFESSIONAL",
            features: [
              "Up to 500 alerts/month",
              "SMS + Email notifications",
              "Advanced analytics",
              "Team collaboration",
            ],
            maxAlerts: 500,
            maxUsers: 5,
            isActive: true,
            isPopular: true,
            displayOrder: 2,
          },
          {
            name: "Enterprise Brokerage",
            description: "For large brokerages and enterprises",
            stripePriceId: "price_enterprise_brokerage",
            price: 1997.0,
            currency: "cad",
            interval: "month",
            tier: "TEAM_ENTERPRISE",
            features: [
              "Unlimited alerts",
              "White-label solution",
              "API access",
              "Custom integrations",
              "Priority support",
            ],
            maxAlerts: null,
            maxUsers: null,
            isActive: true,
            displayOrder: 3,
          },
        ],
      });
      console.log("Created subscription products");
    }

    // Create sample alert preferences for admin if they don't exist
    const adminPrefs = await prisma.alertPreference.findUnique({
      where: { userId: adminUser.id },
    });

    if (!adminPrefs) {
      await prisma.alertPreference.create({
        data: {
          userId: adminUser.id,
          cities: ["Toronto", "Mississauga", "Brampton", "Vaughan", "Markham"],
          maxDistanceKm: 50,
          propertyTypes: ["House", "Condo", "Townhouse"],
          minValue: 50000000, // $500,000 in cents
          maxValue: 200000000, // $2,000,000 in cents
          alertTypes: [
            "POWER_OF_SALE",
            "ESTATE_SALE",
            "DEVELOPMENT_APPLICATION",
          ],
          minPriority: "MEDIUM",
          minOpportunityScore: 50,
          emailNotifications: true,
          pushNotifications: true,
          maxAlertsPerDay: 20,
        },
      });
      console.log("Created admin alert preferences");
    }

    // Create some sample alerts if none exist
    const alertCount = await prisma.alert.count();
    if (alertCount === 0) {
      await prisma.alert.createMany({
        data: [
          {
            title: "Power of Sale - Executive Home in Vaughan",
            description:
              "Luxury executive home with 4+2 bedrooms, 3.5 bathrooms, and premium finishes throughout.",
            address: "123 Executive Way",
            city: "Vaughan",
            province: "ON",
            postalCode: "L4J 8E5",
            alertType: "POWER_OF_SALE",
            source: "ONTARIO_COURT_BULLETINS",
            status: "ACTIVE",
            priority: "HIGH",
            opportunityScore: 85,
            timelineMonths: 3,
            propertyType: "House",
            estimatedValue: 145000000, // $1,450,000 in cents
            bedrooms: 4,
            bathrooms: 3.5,
            courtFileNumber: "CV-2024-0123",
            latitude: 43.8361,
            longitude: -79.4985,
          },
          {
            title: "Estate Sale - Downtown Condo",
            description:
              "Modern condo in prime downtown location, estate sale proceeding.",
            address: "456 Bay Street, Unit 2401",
            city: "Toronto",
            province: "ON",
            postalCode: "M5H 2Y2",
            alertType: "ESTATE_SALE",
            source: "ESTATE_FILINGS",
            status: "ACTIVE",
            priority: "MEDIUM",
            opportunityScore: 75,
            timelineMonths: 6,
            propertyType: "Condo",
            estimatedValue: 85000000, // $850,000 in cents
            bedrooms: 2,
            bathrooms: 2.0,
            probateNumber: "EST-2024-0456",
            executorName: "John Smith",
            latitude: 43.6532,
            longitude: -79.3832,
          },
          {
            title: "Development Application - Mixed Use Project",
            description:
              "Proposed 25-story mixed-use development with retail and residential units.",
            address: "789 Queen Street West",
            city: "Toronto",
            province: "ON",
            postalCode: "M6J 1G1",
            alertType: "DEVELOPMENT_APPLICATION",
            source: "MUNICIPAL_APPLICATIONS",
            status: "ACTIVE",
            priority: "LOW",
            opportunityScore: 60,
            timelineMonths: 24,
            propertyType: "Mixed Use",
            applicationNumber: "DA-2024-0789",
            municipalOffice: "City of Toronto Planning",
            latitude: 43.6505,
            longitude: -79.4107,
          },
        ],
      });
      console.log("Created sample alerts");
    }

    // Create system settings if they don't exist
    const settingsCount = await prisma.systemSetting.count();
    if (settingsCount === 0) {
      await prisma.systemSetting.createMany({
        data: [
          {
            key: "site_title",
            value: "AgentRadar",
            description: "Main site title",
            category: "general",
          },
          {
            key: "max_alerts_per_user_free",
            value: "10",
            description: "Maximum alerts per month for free users",
            category: "limits",
          },
          {
            key: "court_scraping_enabled",
            value: "true",
            description: "Enable court bulletin scraping",
            category: "scraping",
          },
          {
            key: "email_notifications_enabled",
            value: "true",
            description: "Enable email notifications system",
            category: "notifications",
          },
        ],
      });
      console.log("Created system settings");
    }

    return NextResponse.json({
      success: true,
      message: "Database initialization completed successfully",
      adminUser: {
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        error: "Database initialization failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
