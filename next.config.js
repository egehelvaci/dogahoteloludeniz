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
          source: '/api/public-rooms/:path*',
          destination: '/api/public-rooms/:path*',
        },
        {
          source: '/api/public-rooms',
          destination: '/api/public-rooms',
        },
        // Orijinal API rotaları
        {
          source: '/api/rooms/:path*',
          destination: '/api/rooms/:path*',
        },
        {
          source: '/api/rooms',
          destination: '/api/rooms',
        },
        {
          source: '/api/gallery/:path*',
          destination: '/api/gallery/:path*',
        },
        {
          source: '/api/gallery',
          destination: '/api/gallery',
        },
        {
          source: '/api/services/:path*',
          destination: '/api/services/:path*',
        },
        {
          source: '/api/services',
          destination: '/api/services',
        },
        {
          source: '/api/hero-slider/:path*',
          destination: '/api/hero-slider/:path*',
        },
        {
          source: '/api/hero-slider',
          destination: '/api/hero-slider',
        },
        {
          source: '/api/about/:path*',
          destination: '/api/about/:path*',
        },
        {
          source: '/api/about',
          destination: '/api/about',
        },
        {
          source: '/api/slider/:path*',
          destination: '/api/slider/:path*',
        },
        {
          source: '/api/slider',
          destination: '/api/slider',
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
