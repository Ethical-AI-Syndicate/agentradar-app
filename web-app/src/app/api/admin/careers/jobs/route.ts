import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
}

// GET /api/admin/careers/jobs - List all job postings for admin
export async function GET(request: NextRequest) {
  try {
    const user = authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // active, paused, closed
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Record<string, any> = {};
    if (status) where.status = status.toUpperCase();
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              applicationDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobPosting.count({ where })
    ]);

    // Add application statistics
    const jobsWithStats = jobs.map(job => ({
      ...job,
      applicationsCount: job.applications.length,
      newApplicationsCount: job.applications.filter(app => app.status === 'RECEIVED').length,
      recentApplicationsCount: job.applications.filter(app => 
        new Date(app.applicationDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }));

    return NextResponse.json({
      jobs: jobsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin job listings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/careers/jobs - Create new job posting
export async function POST(request: NextRequest) {
  try {
    const user = authenticateAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      department,
      location,
      jobType = 'FULL_TIME',
      salaryRange,
      description,
      requirements = [],
      benefits = [],
      experienceLevel = 'MID',
      remote = false,
      urgentHiring = false,
      applicationDeadline,
      isPublished = false,
      seoTitle,
      seoDescription
    } = body;

    // Validate required fields
    if (!title || !department || !location || !description) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Title, department, location, and description are required'
        },
        { status: 400 }
      );
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let slugCounter = 1;
    const originalSlug = slug;
    while (true) {
      const existingJob = await prisma.jobPosting.findUnique({
        where: { slug }
      });
      
      if (!existingJob) break;
      
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        title: title.trim(),
        slug,
        department: department.trim(),
        location: location.trim(),
        jobType: jobType.toUpperCase(),
        salaryRange: salaryRange?.trim() || null,
        description: description.trim(),
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: Array.isArray(benefits) ? benefits : [],
        experienceLevel: experienceLevel.toUpperCase(),
        remote,
        urgentHiring,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        isPublished,
        status: 'ACTIVE',
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        posted: new Date()
      }
    });

    return NextResponse.json(jobPosting, { status: 201 });

  } catch (error) {
    console.error('Admin job creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}