import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nextAction = request.headers.get('next-action');

  // Chặn các request thăm dò/bot gửi Server Action ID không hợp lệ (như "x")
  if (nextAction && (nextAction === 'x' || nextAction.length < 8)) {
    return new NextResponse('Invalid Action Reference', { status: 400 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
