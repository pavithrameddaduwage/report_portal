import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '') {
    return NextResponse.redirect(new URL('/report-portal/login/', request.url));
  }

  if (
    !pathname.startsWith('/report-portal') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.includes('.')
  ) {
    const target = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return NextResponse.redirect(new URL(`/report-portal${target}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
