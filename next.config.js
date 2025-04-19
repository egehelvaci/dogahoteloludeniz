/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Statik dışa aktarma devre dışı bırakıldı
  images: {
    domains: [
      's3.tebi.io',
      'dogahoteloludeniz.com',
      'www.dogahoteloludeniz.com',
      'dogahoteloludeniz.vercel.app'
    ], // Tüm görsel kaynakları eklendi
    unoptimized: true,
  },
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Vercel ve özel alan adları için ayarlar
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Tüm domainlerden erişime izin ver (gerekirse kısıtlayabilirsiniz)
          },
          {
            key: 'Access-Control-Allow-Methods', 
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          }
        ],
      },
    ];
  },
  // URL yönlendirmeleri
  async rewrites() {
    return {
      beforeFiles: [
        // Ana sayfaya yönlendirme
        {
          source: '/',
          destination: '/tr',
        },
        // Public API isteklerini özellikle koru
        {
          source: '/api/rooms/:path*',
          destination: '/api/rooms/:path*',
          has: [
            {
              type: 'header',
              key: 'x-skip-auth',
              value: '(?<skipAuth>.*)'
            }
          ]
        },
        {
          source: '/api/rooms',
          destination: '/api/rooms',
        },
        // Diğer API isteklerini koru
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
        // Statik dosya isteklerini koru 
        {
          source: '/_next/:path*',
          destination: '/_next/:path*',
        },
        // Diğer statik dosyalar
        {
          source: '/assets/:path*',
          destination: '/assets/:path*', 
        },
        // Görsel dosyaları
        {
          source: '/images/:path*',
          destination: '/images/:path*',
        }
      ],
    };
  }
}

module.exports = nextConfig
