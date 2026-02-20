import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@napi-rs/canvas', 'pdf-parse'],
  outputFileTracingIncludes: {
    '/api/generate': ['./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'],
  }
};

export default nextConfig;
