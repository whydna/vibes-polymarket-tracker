/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/polymarket/:path*',
        destination: 'https://gamma-api.polymarket.com/:path*',
      },
      {
        source: '/api/data/:path*',
        destination: 'https://data-api.polymarket.com/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
