import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/careers/jobs - Public job listings API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const department = searchParams.get('department');
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    // Build where clause - only show active postings
    const where: Record<string, any> = {
      status: 'ACTIVE'
    };

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (type) {
      where.employmentType = type.toUpperCase();
    }

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
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
          employmentType: true,
          salaryRangeMin: true,
          salaryRangeMax: true,
          salaryCurrency: true,
          description: true,
          requirements: true,
          applicationDeadline: true,
          remoteWork: true,
          experienceLevel: true,
          benefits: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.jobPosting.count({ where })
    ]);

    // Add application count for each job (public stats)
    const jobsWithStats = jobs.map(job => ({
      ...job,
      applicationsCount: 0, // Could be real count if needed
      daysPosted: Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      salaryRange: job.salaryRangeMin && job.salaryRangeMax 
        ? `$${(job.salaryRangeMin / 100).toLocaleString()} - $${(job.salaryRangeMax / 100).toLocaleString()} ${job.salaryCurrency}`
        : 'Competitive'
    }));

    return NextResponse.json({
      jobs: jobsWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        departments: await prisma.jobPosting.findMany({
          where: { status: 'ACTIVE' },
          select: { department: true },
          distinct: ['department']
        }).then(results => results.map(r => r.department).filter(Boolean)),
        locations: await prisma.jobPosting.findMany({
          where: { status: 'ACTIVE' },
          select: { location: true },
          distinct: ['location']
        }).then(results => results.map(r => r.location)),
        types: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']
      }
    });

  } catch (error) {
    console.error('Public job listings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}