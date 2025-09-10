import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const post = await prisma.blogPost.findUnique({
      where: { 
        slug,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Calculate read time
    const wordsPerMinute = 200;
    const wordCount = post.content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: post.category,
      tags: post.tags,
      viewCount: post.viewCount,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      readTime: `${readTime} min read`,
      author: {
        name: `${post.author.firstName} ${post.author.lastName}`,
        role: post.author.role || "Content Writer"
      }
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}