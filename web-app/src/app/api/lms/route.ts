// Next.js API Route - Learning Management System
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
}

// Authentication helper
function authenticateToken(request: NextRequest): { success: boolean; userId?: string; error?: string } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { success: false, error: 'No token provided' };
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { success: true, userId: decoded.userId };
  } catch {
    return { success: false, error: 'Invalid token' };
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const auth = authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const db = getPrisma();

    // GET /api/lms?action=courses - List all courses
    if (action === 'courses') {
      const courses = await db.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          duration: true,
          price: true,
          isPublished: true,
          createdAt: true,
          _count: {
            select: { enrollments: true }
          }
        },
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: courses,
        message: `Found ${courses.length} courses`
      }, { headers: corsHeaders });
    }

    // GET /api/lms?action=my-courses - User's enrolled courses
    if (action === 'my-courses') {
      const enrollments = await db.courseEnrollment.findMany({
        where: { userId: auth.userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              level: true,
              duration: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: enrollments,
        message: `Found ${enrollments.length} enrolled courses`
      }, { headers: corsHeaders });
    }

    // GET /api/lms?action=progress&courseId=ID - Course progress
    if (action === 'progress') {
      const courseId = searchParams.get('courseId');
      if (!courseId) {
        return NextResponse.json({ success: false, error: 'Course ID required' }, { status: 400, headers: corsHeaders });
      }

      const progress = await db.courseProgress.findMany({
        where: { 
          userId: auth.userId,
          courseId: courseId
        },
        include: {
          lesson: {
            select: { id: true, title: true, order: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: progress,
        message: `Found ${progress.length} progress records`
      }, { headers: corsHeaders });
    }

    // GET /api/lms?action=certificates - User's certificates
    if (action === 'certificates') {
      const certificates = await db.certificate.findMany({
        where: { userId: auth.userId },
        include: {
          course: {
            select: { id: true, title: true, category: true }
          }
        },
        orderBy: { issuedAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: certificates,
        message: `Found ${certificates.length} certificates`
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('LMS API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    const auth = authenticateToken(request);
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401, headers: corsHeaders });
    }

    const db = getPrisma();

    // POST /api/lms?action=enroll - Enroll in course
    if (action === 'enroll') {
      const { courseId } = body;
      
      if (!courseId) {
        return NextResponse.json({ success: false, error: 'Course ID required' }, { status: 400, headers: corsHeaders });
      }

      // Check if already enrolled
      const existingEnrollment = await db.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: auth.userId!,
            courseId: courseId
          }
        }
      });

      if (existingEnrollment) {
        return NextResponse.json({ success: false, error: 'Already enrolled in this course' }, { status: 409, headers: corsHeaders });
      }

      const enrollment = await db.courseEnrollment.create({
        data: {
          userId: auth.userId!,
          courseId: courseId,
          enrolledAt: new Date()
        },
        include: {
          course: {
            select: { id: true, title: true, description: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: enrollment,
        message: 'Successfully enrolled in course'
      }, { status: 201, headers: corsHeaders });
    }

    // POST /api/lms?action=update-progress - Update lesson progress
    if (action === 'update-progress') {
      const { courseId, lessonId, status, timeSpent } = body;
      
      if (!courseId || !lessonId || !status) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
      }

      const progress = await db.courseProgress.upsert({
        where: {
          userId_courseId_lessonId: {
            userId: auth.userId!,
            courseId: courseId,
            lessonId: lessonId
          }
        },
        update: {
          status: status,
          timeSpent: timeSpent || 0,
          updatedAt: new Date()
        },
        create: {
          userId: auth.userId!,
          courseId: courseId,
          lessonId: lessonId,
          status: status,
          timeSpent: timeSpent || 0
        }
      });

      return NextResponse.json({
        success: true,
        data: progress,
        message: 'Progress updated successfully'
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('LMS API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders });
  }
}