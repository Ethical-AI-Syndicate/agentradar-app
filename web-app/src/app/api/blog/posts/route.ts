import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/blog/posts - Public blog posts API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';

    const skip = (page - 1) * limit;
    
    // Build where clause - only show published posts
    const where: Record<string, any> = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date() // Only show posts that are published and not scheduled for future
      }
    };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = { has: tag };
    }

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
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          tags: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: featured 
          ? [{ viewCount: 'desc' }, { publishedAt: 'desc' }] 
          : { publishedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    // Calculate read time (approximate)
    const postsWithReadTime = posts.map(post => ({
      ...post,
      readTime: Math.ceil((post.excerpt?.split(' ').length || 0) / 200) + ' min read',
      author: {
        name: `${post.author.firstName} ${post.author.lastName}`,
        role: 'Market Analyst' // You could add this to the User model
      }
    }));

    return NextResponse.json({
      posts: postsWithReadTime,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Public blog posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}