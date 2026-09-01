import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.84', '192.168.1.235'],
  async rewrites() {
    // In production, proxy to the Render backend. Locally, proxy to localhost.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
