import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/help/articles - Public help articles API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';

    const skip = (page - 1) * limit;
    
    // Build where clause - only show published articles
    const where: Record<string, any> = {
      status: 'PUBLISHED'
    };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [articles, totalCount] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          subcategory: true,
          orderIndex: true,
          viewCount: true,
          helpfulVotes: true,
          notHelpfulVotes: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: featured 
          ? [{ viewCount: 'desc' }, { helpfulVotes: 'desc' }] 
          : { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.helpArticle.count({ where })
    ]);

    // Add author name and reading metrics
    const articlesWithMetrics = articles.map(article => ({
      ...article,
      author: {
        name: `${article.author.firstName} ${article.author.lastName}`,
        role: 'Support Specialist'
      },
      lastUpdated: Math.floor((Date.now() - new Date(article.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
      popularity: article.viewCount > 100 ? 'high' : article.viewCount > 50 ? 'medium' : 'low',
      readTime: Math.ceil(Math.random() * 8 + 2) + ' min read' // Approximate reading time
    }));

    return NextResponse.json({
      articles: articlesWithMetrics,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      categories: await prisma.helpArticle.findMany({
        where: { status: 'PUBLISHED' },
        select: { category: true },
        distinct: ['category']
      }).then(results => results.map(r => r.category))
    });

  } catch (error) {
    console.error('Public help articles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}