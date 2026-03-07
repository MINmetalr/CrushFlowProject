import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://app.minmetal.biz/api/:path*',
      },
    ];
  },
};

export default nextConfig;