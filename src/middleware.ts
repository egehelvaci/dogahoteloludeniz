import { NextRequest, NextResponse } from 'next/server';

// JWT sırrı - üretim ortamında ortam değişkeni olarak saklanmalıdır
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const COOKIE_NAME = 'auth_token';

// Basit token doğrulama (jose kütüphanesi olmadan)
async function verifyToken(token: string) {
  try {
    // Basit bir doğrulama yaklaşımı
    // NOT: Bu, tam bir JWT doğrulaması değildir, sadece token'ın varlığını kontrol eder
    // Gerçek uygulamada daha gelişmiş bir doğrulama kullanılmalıdır
    
    // Tokenin varlığını kontrol ediyoruz, bu basit yaklaşımda
    // sadece bir token olup olmadığını kontrol ediyoruz
    return { verified: !!token, payload: {} };
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return { verified: false };
  }
}

export async function middleware(request: NextRequest) {
  // Şu an URL'nin admin bölümünde miyiz kontrol et
  const isAdminPage = request.nextUrl.pathname.includes('/admin');
  
  // Admin login sayfası için middleware'i atla
  if (request.nextUrl.pathname.includes('/admin/login')) {
    return NextResponse.next();
  }
  
  // Sadece admin sayfalarını korumak istiyoruz
  if (!isAdminPage) {
    return NextResponse.next();
  }
  
  // API rotalarını kontrol et ve auth endpoint'ini bypass et
  if (request.nextUrl.pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }
  
  // import-rooms API'si için bypass
  if (request.nextUrl.pathname.startsWith('/api/admin/import-rooms')) {
    return NextResponse.next();
  }
  
  try {
    // Cookie'den token'ı al
    const token = request.cookies.get(COOKIE_NAME)?.value;
    
    // Token kontrolü
    if (!token) {
      // Kullanıcının dil tercihi URL'den alınıyor
      const lang = request.nextUrl.pathname.split('/')[1] || 'tr';
      return NextResponse.redirect(new URL(`/${lang}/admin/login`, request.url));
    }
    
    // Token doğrulama
    const { verified } = await verifyToken(token);
    
    if (verified) {
      return NextResponse.next();
    } else {
      // Token geçersiz veya süresi dolmuş
      const lang = request.nextUrl.pathname.split('/')[1] || 'tr';
      return NextResponse.redirect(new URL(`/${lang}/admin/login`, request.url));
    }
  } catch (error) {
    console.error('Middleware hatası:', error);
    return NextResponse.next();
  }
}

// Middleware'in hangi rotalarda çalışacağını belirle
export const config = {
  matcher: [
    // Admin sayfaları için - daha spesifik eşleşme için
    '/admin/:path*',
    '/:lang/admin/:path*',
    // Sadece admin API rotaları için - daha spesifik eşleşme için
    '/api/admin/:path*'
  ],
};
