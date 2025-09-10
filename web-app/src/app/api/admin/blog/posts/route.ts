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

// GET /api/admin/blog/posts - List all blog posts for admin
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
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Admin blog posts list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/blog/posts - Create new blog post
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
      excerpt,
      status = 'DRAFT',
      featuredImage,
      seoTitle,
      seoDescription,
      tags = [],
      category
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
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug }
      });
      
      if (!existingPost) break;
      
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Create blog post
    const blogPost = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        content,
        excerpt: excerpt?.trim() || null,
        authorId: user.id,
        status: status.toUpperCase(),
        featuredImage: featuredImage?.trim() || null,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        category: category?.trim() || null,
        publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null
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

    return NextResponse.json(blogPost, { status: 201 });

  } catch (error) {
    console.error('Admin blog post creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}