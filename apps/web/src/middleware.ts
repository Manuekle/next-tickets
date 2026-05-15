import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth handled by client-side zustand store + AuthProvider
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
