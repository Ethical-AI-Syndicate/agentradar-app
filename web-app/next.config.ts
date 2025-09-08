import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ SECURITY FIX: Removed ignoreDuringBuilds and ignoreBuildErrors
  // These were identified as HIGH SECURITY RISK in Phase 1 assessment
  // Now enforcing proper linting and type checking in builds
  
  // Remove outputFileTracingRoot to fix Vercel deployment path issues
  
  experimental: {
    // Enable modern optimizations for performance
    optimizePackageImports: [
      '@radix-ui/react-icons', 
      'lucide-react',
      '@stripe/stripe-js'
    ],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enhanced security headers (addresses Phase 1 findings)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Image optimization for performance
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false, // Security: Prevent SVG-based attacks
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
