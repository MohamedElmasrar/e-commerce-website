import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server output used by frontend/Dockerfile.
  output: "standalone",
  // The browser talks to the backend through this same-origin proxy so the httpOnly
  // refresh cookie (path /api/v1/auth, SameSite=Lax) is sent without any CORS setup.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;
