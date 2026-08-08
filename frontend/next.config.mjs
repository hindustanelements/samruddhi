import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:5000";
const appRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: appRoot,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${apiTarget}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;
