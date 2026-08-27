/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  assetPrefix: '/report-portal/',
  basePath: '/report-portal',
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/report-portal/login/',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

