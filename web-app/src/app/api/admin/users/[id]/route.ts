import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, SubscriptionTier } from '@/generated/prisma';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'ADMIN') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    const userData = await prisma.user.findUnique({
      where: { id },
      include: {
        alertPreferences: true,
        _count: {
          select: {
            userAlerts: true,
            savedProperties: true
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { 
          error: 'User not found',
          message: 'User with this ID does not exist'
        },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = userData;

    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Admin user details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const {
      firstName,
      lastName,
      email,
      role,
      subscriptionTier,
      isActive,
      company,
      location
    } = await request.json();

    // Validate role and subscription tier
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { 
          error: 'Invalid role',
          message: 'Role must be one of: ' + Object.values(UserRole).join(', ')
        },
        { status: 400 }
      );
    }

    if (subscriptionTier && !Object.values(SubscriptionTier).includes(subscriptionTier)) {
      return NextResponse.json(
        { 
          error: 'Invalid subscription tier',
          message: 'Subscription tier must be one of: ' + Object.values(SubscriptionTier).join(', ')
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        role,
        subscriptionTier,
        isActive,
        company,
        location
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        company: true,
        location: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}