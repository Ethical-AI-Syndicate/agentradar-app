import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test basic database connectivity
    await prisma.$connect();

    const tables: Record<string, string | number> = {};

    // Check all core tables
    try {
      tables.userCount = await prisma.user.count();
      tables.users = "exists";
    } catch {
      tables.users = "missing";
    }

    try {
      tables.alertCount = await prisma.alert.count();
      tables.alerts = "exists";
    } catch {
      tables.alerts = "missing";
    }

    try {
      tables.earlyAdopterCount = await prisma.earlyAdopterToken.count();
      tables.earlyAdopterTokens = "exists";
    } catch {
      tables.earlyAdopterTokens = "missing";
    }

    try {
      tables.supportTicketCount = await prisma.supportTicket.count();
      tables.supportTickets = "exists";
    } catch {
      tables.supportTickets = "missing";
    }

    try {
      tables.courtCaseCount = await prisma.courtCase.count();
      tables.courtCases = "exists";
    } catch {
      tables.courtCases = "missing";
    }

    try {
      tables.productCount = await prisma.product.count();
      tables.products = "exists";
    } catch {
      tables.products = "missing";
    }

    try {
      tables.alertPreferenceCount = await prisma.alertPreference.count();
      tables.alertPreferences = "exists";
    } catch {
      tables.alertPreferences = "missing";
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      tables,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
