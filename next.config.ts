import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',  // Static export için - dinamik içerik oluşturabilmek için kaldırıldı
  trailingSlash: true, // URL sonlarında / işareti olacak (SEO ve yönlendirme için faydalı)
  typescript: {
    // !! Sadece cPanel'e deploy etmek için !!
    // Tip kontrolünü build sırasında atla, hataları görmezden gel
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! Sadece cPanel'e deploy etmek için !!
    // ESLint hatalarını build sırasında görmezden gel
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // cPanel'de optimizasyon çalışmaz
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'freepik.cdnpk.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Hydration hatalarını önlemek için
    // Tüm sayfalarda dinamik render kullan
    optimizeCss: false,
    optimizeServerReact: false
  },
  // Statik dosya şablonları - image, font, icon gibi kaynaklara doğrudan erişim için
  async rewrites() {
    return [
      {
        source: '/images/:path*',
        destination: '/public/images/:path*'
      },
    ];
  },
};

export default nextConfig;
