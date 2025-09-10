"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/footer";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  User,
  Share2,
  BookOpen,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  tags: string[];
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
}

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      loadBlogPost(params.slug as string);
    }
  }, [params.slug]);

  const loadBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${window.location.origin}/api/blog/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Blog post not found");
        } else {
          setError("Failed to load blog post");
        }
        return;
      }
      
      const data = await response.json();
      setPost(data.post);
      
      // Increment view count
      await fetch(`${window.location.origin}/api/blog/posts/${slug}/view`, {
        method: 'POST'
      });
      
    } catch (error) {
      console.error('Failed to load blog post:', error);
      setError("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
                <span className="text-xl font-bold">AgentRadar</span>
              </Link>
              <div className="flex items-center space-x-6">
                <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
                <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
                <Link href="/contact">
                  <Button>Contact Us</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Error State */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === "Blog post not found" ? "Post Not Found" : "Error Loading Post"}
          </h1>
          <p className="text-gray-600 mb-8">
            {error === "Blog post not found" 
              ? "The blog post you're looking for doesn't exist or has been moved."
              : "We couldn't load this blog post. Please try again later."}
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
              <Link href="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/blog" className="hover:text-gray-700">Blog</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{post.title}</span>
        </nav>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-4">
            <Badge className="bg-blue-100 text-blue-800 mr-2">
              {post.category}
            </Badge>
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="mr-1">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount} views</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-y">
            <p className="text-lg text-gray-700 italic">
              {post.excerpt}
            </p>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
            {post.content}
          </div>
        </div>

        {/* Article Footer */}
        <footer className="border-t pt-8 mb-12">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Share this article:</span>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </footer>
      </article>

      <Footer />
    </div>
  );
}