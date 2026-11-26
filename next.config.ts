import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // A página "Newsletter" passou a se chamar "Editais e eventos"
      { source: '/newsletter', destination: '/editais-e-eventos', permanent: true },
    ];
  },
};

export default nextConfig;
