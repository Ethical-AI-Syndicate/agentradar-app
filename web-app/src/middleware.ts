import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  console.log(`[Middleware] Host: ${hostname}, Path: ${url.pathname}`);

  // Handle admin subdomain
  if (hostname === 'admin.agentradar.app' || hostname.startsWith('admin.')) {
    // If already on admin path, continue normally
    if (url.pathname.startsWith('/admin')) {
      console.log(`[Middleware] Already on admin path, continuing`);
      return NextResponse.next();
    }
    
    // For root path, rewrite to admin dashboard (don't redirect)
    if (url.pathname === '/') {
      console.log(`[Middleware] Rewriting root to /admin`);
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
    
    // For other paths, rewrite to admin equivalent (don't redirect)
    console.log(`[Middleware] Rewriting ${url.pathname} to /admin${url.pathname}`);
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Handle main domain - prevent access to admin routes
  if (hostname === 'agentradar.app' || (!hostname.includes('admin') && hostname.includes('agentradar'))) {
    if (url.pathname.startsWith('/admin')) {
      // Redirect admin access on main domain to admin subdomain
      const adminUrl = new URL(url);
      adminUrl.hostname = 'admin.agentradar.app';
      console.log(`[Middleware] Redirecting admin access to subdomain`);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
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