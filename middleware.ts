import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.cdnfonts.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.cdnfonts.com",
  "connect-src 'self' https://api.getwaitlist.com https://api.predifi.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const staticAssetPattern =
  /\.(?:css|js|map|png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|json|woff|woff2)$/i;

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.delete("content-security-policy");
  requestHeaders.delete("content-security-policy-report-only");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), bluetooth=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), xr-spatial-tracking=()"
  );

  if (!staticAssetPattern.test(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Content-Security-Policy", csp);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
