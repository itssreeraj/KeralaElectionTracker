import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Public APIs
      {
        source: "/api/v1/public/:path*",
        destination: "/api/proxy/public/:path*",
      },

      // Admin APIs
      {
        source: "/api/v1/admin/:path*",
        destination: "/api/proxy/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
