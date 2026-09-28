import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // When this folder lives inside a larger repo with another package-lock.json, Next still traces from here.
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  // Always serve uploads via API (Hostinger / next start often skip public/ for dynamic files).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/uploads/:path*',
          destination: '/api/files/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
