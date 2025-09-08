import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Debug endpoint that mimics the main logic but with detailed error reporting
export async function GET(request: NextRequest) {
  try {
    console.log('Debug2: Starting - checking environment');
    
    // Check environment variables
    const jwtSecret = process.env.JWT_SECRET;
    console.log('Debug2: JWT_SECRET exists:', !!jwtSecret);
    console.log('Debug2: NODE_ENV:', process.env.NODE_ENV);
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log('Debug2: Database connected, user count:', userCount);
    
    // Create a mock admin user lookup
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true }
    });
    console.log('Debug2: Admin users found:', adminUsers.length);
    
    // Test support ticket query
    const ticketCount = await prisma.supportTicket.count();
    console.log('Debug2: Support ticket count:', ticketCount);
    
    // Test the actual query that fails
    const testQuery = await prisma.supportTicket.findMany({
      where: {},
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
      take: 5,
    });
    
    console.log('Debug2: Test query successful, results:', testQuery.length);
    
    return NextResponse.json({
      success: true,
      debug: true,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length
      },
      database: {
        userCount,
        adminCount: adminUsers.length,
        ticketCount,
        testQueryResults: testQuery.length
      },
      adminUsers: adminUsers,
      sampleTickets: testQuery.slice(0, 2)
    });
    
  } catch (error) {
    console.error('Debug2: Detailed error:', error);
    return NextResponse.json({
      success: false,
      debug: true,
      error: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}