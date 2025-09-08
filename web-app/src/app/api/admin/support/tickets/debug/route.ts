import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Temporary debug version of the admin support endpoint without authentication
export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Starting admin support tickets query');
    
    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    console.log('Debug: Parsed parameters', { page, limit, status, priority, category });

    // Build where clause
    const where: Record<string, string> = {};
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (category && category !== 'all') where.category = category;

    console.log('Debug: Built where clause', where);

    // Get tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true,
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where })
    ]);

    console.log('Debug: Query successful', { ticketCount: tickets.length, totalCount });

    return NextResponse.json({
      success: true,
      debug: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Debug: Error in support tickets endpoint:', error);
    return NextResponse.json({
      success: false,
      debug: true,
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}