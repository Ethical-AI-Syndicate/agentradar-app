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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // Changed from DENY to SAMEORIGIN for proper functionality
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: *.stripe.com; connect-src 'self' https://api.agentradar.app https://admin.agentradar.app https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), location=(), payment=(self)',
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
