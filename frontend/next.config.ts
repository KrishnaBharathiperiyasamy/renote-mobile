import type { NextConfig } from "next";
import path from "path";

const AUTH_API_BASE_URL = (process.env.AUTH_API_BASE_URL || "http://localhost:3004").replace(/\/$/, "");
const DATA_API_BASE_URL = (process.env.DATA_API_BASE_URL || "http://localhost:6003").replace(/\/$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../"),
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  allowedDevOrigins: [
    "**.devtunnels.ms",
    "*.devtunnels.ms",
    "*.inc1.devtunnels.ms",
    "**.loca.lt",
    "*.loca.lt",
    "**.trycloudflare.com",
    "*.trycloudflare.com",
    "**.app.github.dev",
    "*.app.github.dev",
    "**.ngrok-free.app",
    "*.ngrok-free.app",
    "localhost",
    "127.0.0.1",
  ],
  // Expose these env vars to the browser bundle.
  // Values are picked from .env.development (next dev) or .env.production (next build).
  env: {
    AUTH_API_BASE_URL: process.env.AUTH_API_BASE_URL,
    DATA_API_BASE_URL: process.env.DATA_API_BASE_URL,
    AUTH_APP_CODE: process.env.AUTH_APP_CODE,
    AUTH_ROLE_CODE: process.env.AUTH_ROLE_CODE,
    FRONT_END_URL: process.env.FRONT_END_URL,
  },
  async rewrites() {
    return [
      {
        source: "/auth-proxy/:path*",
        destination: `${AUTH_API_BASE_URL}/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${DATA_API_BASE_URL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${DATA_API_BASE_URL}/uploads/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${DATA_API_BASE_URL}/socket.io/:path*`,
      },
    ];
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
