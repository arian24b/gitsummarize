/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  images: {
    domains: [
      'img.shields.io',
      'shields.io',
      'github.com',
      'raw.githubusercontent.com',
      'camo.githubusercontent.com',
      'travis-ci.org',
      'travis-ci.com',
      'codecov.io',
      'coveralls.io',
      'badge.fury.io',
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  eslint: {
    // Don't run ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking for speed
    ignoreBuildErrors: true,
  },
  output: 'standalone',
};

export default config;
