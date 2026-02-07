import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Public APIs - handled both ways
      {
        source: "/api/v1/public/:path*",
        destination: "/api/proxy/public/:path*",
      },
      {
        source: "/v1/public/:path*",
        destination: "/api/proxy/public/:path*",
      },

      // Admin APIs - handled both ways
      {
        source: "/api/v1/admin/:path*",
        destination: "/api/proxy/admin/:path*",
      },
      {
        source: "/v1/admin/:path*",
        destination: "/api/proxy/admin/:path*",
      },
    ];
  },
};

export default nextConfig;
