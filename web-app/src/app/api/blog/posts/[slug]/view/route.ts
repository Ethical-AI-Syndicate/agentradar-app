import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Increment view count for the blog post
    const post = await prisma.blogPost.update({
      where: { slug },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      viewCount: post.viewCount 
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { error: "Failed to update view count" },
      { status: 500 }
    );
  }
}