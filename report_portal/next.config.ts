import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  basePath: '/report-portal',
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/report-portal/',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;


 
