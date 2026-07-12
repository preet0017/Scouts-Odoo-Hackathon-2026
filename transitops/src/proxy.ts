import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl

  // Allow API auth routes through unconditionally
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // If already logged in, redirect away from login to avoid loop
  if (pathname.startsWith('/login')) {
    if (req.auth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect all other routes
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

