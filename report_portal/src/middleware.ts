import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If user accesses /report-portal or /report-portal/ directly, send to /login
  if (pathname === '/report-portal' || pathname === '/report-portal/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user visits /report-portal/<subpath>/ with trailing slash, normalize to /<subpath>
  if (pathname.startsWith('/report-portal/')) {
    let cleanSubpath = pathname.replace(/^\/report-portal/, '').replace(/\/$/, '');
    if (!cleanSubpath || cleanSubpath === '/') {
       return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL(cleanSubpath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
