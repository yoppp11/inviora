import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  if (
    pathname.startsWith('/invitation') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Dashboard routes need token in cookie or header
  // Client-side auth check handles the actual redirect; 
  // this middleware is a UX enhancement layer
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
