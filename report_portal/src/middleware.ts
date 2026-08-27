import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Seamlessly redirect any /report-portal/* requests to /*
  if (pathname.startsWith('/report-portal')) {
    const newPath = pathname.replace(/^\/report-portal/, '') || '/';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
