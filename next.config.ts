import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // When this folder lives inside a larger repo with another package-lock.json, Next still traces from here.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
