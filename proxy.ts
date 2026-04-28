import { NextRequest, NextResponse } from "next/server";

const REALM = "Surface IQ";

export function proxy(request: NextRequest) {
  const password = process.env.SURFACE_IQ_PASSWORD;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd || !password) {
    return NextResponse.next();
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice("Basic ".length));
    const idx = decoded.indexOf(":");
    const supplied = idx === -1 ? decoded : decoded.slice(idx + 1);
    if (timingSafeEqual(supplied, password)) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}"`,
    },
  });
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/health).*)"],
};
