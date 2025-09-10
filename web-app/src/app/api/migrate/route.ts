import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - only allow with correct secret
    const { secret } = await request.json();
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run raw SQL to create SupportTicket tables if they don't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "category" TEXT,
        "assignedToId" TEXT,
        "resolution" TEXT,
        "resolvedAt" TIMESTAMP(3),
        "resolvedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
        "id" TEXT NOT NULL,
        "ticketId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "isFromAdmin" BOOLEAN NOT NULL DEFAULT false,
        "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
      );
    `;

    // Add foreign key constraints if they don't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "support_tickets" 
        ADD CONSTRAINT "support_tickets_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "support_tickets" 
        ADD CONSTRAINT "support_tickets_assignedToId_fkey" 
        FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `;
    } catch {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "support_ticket_messages" 
        ADD CONSTRAINT "support_ticket_messages_ticketId_fkey" 
        FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "support_ticket_messages" 
        ADD CONSTRAINT "support_ticket_messages_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
    } catch {
      // Constraint might already exist
    }

    return NextResponse.json({
      success: true,
      message: "SupportTicket tables created successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
