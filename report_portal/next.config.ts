/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/report-portal',
        destination: '/',
        permanent: false,
      },
      {
        source: '/report-portal/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;


