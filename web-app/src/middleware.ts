import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  console.log(`[Middleware] Host: ${hostname}, Path: ${url.pathname}`);

  let response: NextResponse;

  // Handle admin subdomain
  if (hostname === 'admin.agentradar.app' || hostname.startsWith('admin.')) {
    // If already on admin path, continue normally
    if (url.pathname.startsWith('/admin')) {
      console.log(`[Middleware] Already on admin path, continuing`);
      response = NextResponse.next();
    } else if (url.pathname === '/') {
      // For root path, rewrite to admin dashboard (don't redirect)
      console.log(`[Middleware] Rewriting root to /admin`);
      url.pathname = '/admin';
      response = NextResponse.rewrite(url);
    } else if (url.pathname === '/login') {
      // For login on admin subdomain, keep using /login but add admin context
      console.log(`[Middleware] Admin login request, keeping /login path`);
      response = NextResponse.next();
    } else {
      // For other paths, rewrite to admin equivalent (don't redirect)
      console.log(`[Middleware] Rewriting ${url.pathname} to /admin${url.pathname}`);
      url.pathname = `/admin${url.pathname}`;
      response = NextResponse.rewrite(url);
    }
  } else if (hostname === 'agentradar.app' || (!hostname.includes('admin') && hostname.includes('agentradar'))) {
    // Handle main domain - prevent access to admin routes
    if (url.pathname.startsWith('/admin')) {
      // Redirect admin access on main domain to admin subdomain
      const adminUrl = new URL(url);
      adminUrl.hostname = 'admin.agentradar.app';
      console.log(`[Middleware] Redirecting admin access to subdomain`);
      response = NextResponse.redirect(adminUrl);
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  // Add security headers to all responses
  addSecurityHeaders(response);

  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // X-Frame-Options: Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection: Enable XSS filtering (legacy but still good)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy: Comprehensive content security
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://api.agentradar.app https://cloudflareinsights.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspPolicy);
  
  // Strict-Transport-Security: Force HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy: Control browser features
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()'
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};