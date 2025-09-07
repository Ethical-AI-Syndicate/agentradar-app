import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Handle admin subdomain
  if (hostname === 'admin.agentradar.app' || hostname.startsWith('admin.')) {
    // If already on admin path, continue
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    
    // Redirect to admin dashboard for root path
    if (url.pathname === '/') {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    
    // Redirect other paths to admin equivalent
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.redirect(url);
  }

  // Handle main domain - prevent access to admin routes
  if (hostname === 'agentradar.app' || (!hostname.includes('admin') && hostname.includes('agentradar'))) {
    if (url.pathname.startsWith('/admin')) {
      // Redirect admin access on main domain to admin subdomain
      const adminUrl = new URL(url);
      adminUrl.hostname = 'admin.agentradar.app';
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