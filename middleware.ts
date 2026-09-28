import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'alkinda_session';

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLineage = pathname === '/lineage' || pathname.startsWith('/lineage/');
  const isLogin = pathname === '/login';

  if (!isLineage && !isLogin) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const key = secretKey();
  let authed = false;
  if (token && key) {
    try {
      await jwtVerify(token, key);
      authed = true;
    } catch {
      authed = false;
    }
  }

  if (isLineage && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && authed) {
    const url = request.nextUrl.clone();
    url.pathname = '/lineage/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lineage', '/lineage/:path*', '/login'],
};
