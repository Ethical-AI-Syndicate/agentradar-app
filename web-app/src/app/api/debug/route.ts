import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test basic prisma connection
    await prisma.$connect();

    // Test SupportTicket table exists and can be queried
    const ticketCount = await prisma.supportTicket.count();

    // Test a basic query similar to what the admin endpoint does
    const testQuery = await prisma.supportTicket.findMany({
      take: 1,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            subscriptionTier: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: "success",
      database: "connected",
      supportTicketCount: ticketCount,
      sampleQuery: testQuery.length > 0 ? "success" : "no_data",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
