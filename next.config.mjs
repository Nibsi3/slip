import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    const securityHeaders = [
      // Prevent clickjacking
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // Prevent MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Stop old IE from rendering pages in compatibility mode
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // Referrer policy — don't leak full URL to third parties
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permissions policy — disable unnecessary browser APIs
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
      },
      // HSTS — 2 years, include subdomains, submit to preload list
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // Content Security Policy
      // - default: same-origin only
      // - scripts: self + Next.js inline (unsafe-inline for Next hydration) + Sentry CDN
      // - styles: self + inline (Tailwind generates inline styles)
      // - images: self + data URIs + blob (Next/Image) + WhatsApp CDN
      // - connect: self + Sentry ingest + Stitch + OTT + Meta Graph API
      // - frame-ancestors: self only (supports SAMEORIGIN for iframes)
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://browser.sentry-cdn.com https://js.sentry-cdn.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.sentry.io https://stitch.money https://api.stitch.money https://api.graph.cool https://graph.facebook.com https://*.ott.co.za wss:",
          "media-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    const prodOnlyHeaders = [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/api/tips/:code',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];

    // Apply security headers in all environments; cache headers production-only
    if (process.env.NODE_ENV !== "production") {
      return [{ source: '/(.*)', headers: securityHeaders }];
    }

    return prodOnlyHeaders;
  },
  poweredByHeader: false,
  compress: true,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  treeshake: {
    removeDebugLogging: true,
  },
});
