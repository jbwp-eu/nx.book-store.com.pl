import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n";

const protectedPaths = [
  /\/shipping-address/,
  /\/payment-method/,
  /\/place-order/,
  /\/order\//,
  /\/user\//,
  /\/admin/,
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathnameHasLocale = new RegExp(`^/(${locales.join("|")})(/|$)`).test(
    pathname,
  );

  if (!pathnameHasLocale) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}${search}`, request.url),
    );
  }

  const locale = pathname.split("/")[1] as Locale;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const isProtected = protectedPaths.some((pattern) => pattern.test(pathname));
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (isProtected && !hasSession) {
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!request.cookies.get("sessionCartId")) {
    response.cookies.set("sessionCartId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/|.*\\..*).*)"],
};
