/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'imagekit.io',
      'ik.imagekit.io',
      's3.tebi.io',
      'lh3.googleusercontent.com',
      'api.dogahotelfethiye.com',
      'dogahotelfethiye.com',
      'localhost',
      'res.cloudinary.com',
      'picsum.photos',
      'via.placeholder.com',
      'images.unsplash.com'
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb', // API istekleri için maksimum boyut sınırı
    },
  },
};

export default nextConfig; 