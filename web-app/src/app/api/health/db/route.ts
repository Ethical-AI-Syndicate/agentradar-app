import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test basic database connectivity
    await prisma.$connect();
    
    // Try to query a simple table that should exist
    const userCount = await prisma.user.count();
    
    // Check if SupportTicket table exists
    try {
      const ticketCount = await prisma.supportTicket.count();
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        userCount,
        ticketCount,
        tables: {
          users: 'exists',
          supportTickets: 'exists'
        }
      });
    } catch (ticketError) {
      return NextResponse.json({
        status: 'partial',
        database: 'connected',
        userCount,
        tables: {
          users: 'exists',
          supportTickets: 'missing'
        },
        error: 'SupportTicket table does not exist'
      }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: (error as Error).message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}