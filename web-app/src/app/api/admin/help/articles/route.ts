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

// GET /api/admin/help/articles - List all help articles for admin
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
    const status = searchParams.get('status'); // draft, published, archived
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Record<string, any> = {};
    if (status) where.status = status.toUpperCase();
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [articles, totalCount] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.helpArticle.count({ where })
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin help articles list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/help/articles - Create new help article
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
      content,
      summary,
      category,
      tags = [],
      difficulty = 'BEGINNER',
      status = 'DRAFT',
      isPublic = true,
      seoTitle,
      seoDescription
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'Title and content are required'
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
      const existingArticle = await prisma.helpArticle.findUnique({
        where: { slug }
      });
      
      if (!existingArticle) break;
      
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Calculate read time (approximate)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Create help article
    const helpArticle = await prisma.helpArticle.create({
      data: {
        title: title.trim(),
        slug,
        content,
        summary: summary?.trim() || null,
        authorId: user.id,
        category: category?.trim() || 'General',
        tags: Array.isArray(tags) ? tags : [],
        difficulty: difficulty.toUpperCase(),
        status: status.toUpperCase(),
        isPublic,
        readTime,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null,
        viewCount: 0,
        helpfulCount: 0
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(helpArticle, { status: 201 });

  } catch (error) {
    console.error('Admin help article creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}