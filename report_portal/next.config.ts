/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/report-portal/:path*',
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;



