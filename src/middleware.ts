import { NextRequest, NextResponse } from 'next/server';

// JWT sırrı - üretim ortamında ortam değişkeni olarak saklanmalıdır
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const COOKIE_NAME = 'auth_token';

// Token doğrulama fonksiyonu
async function verifyToken(token: string) {
  try {
    if (!token) {
      console.log('Token bulunamadı');
      return { verified: false, payload: null };
    }
    
    // Token formatını kontrol et (basit bir kontrol)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Geçersiz token formatı');
      return { verified: false, payload: null };
    }
    
    try {
      // Base64 encoded payload kısmını decode et
      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      
      // Token süresi kontrolü
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('Token süresi dolmuş');
        return { verified: false, payload: null };
      }
      
      // Diğer kontroller (örneğin, issuer, audience, vb.)
      // Bu örnekte basit tutuyoruz
      
      return { verified: true, payload };
    } catch (decodeError) {
      console.error('Token decode hatası:', decodeError);
      return { verified: false, payload: null };
    }
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return { verified: false, payload: null };
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Public API rotaları için middleware'i atla
  if (pathname.startsWith('/api/public-')) {
    console.log('Public API rotası tespit edildi, middleware atlanıyor:', pathname);
    return NextResponse.next();
  }
  
  // Orijinal API rotaları için middleware'i atla
  if (pathname.startsWith('/api/rooms') || 
      pathname.startsWith('/api/gallery') || 
      pathname.startsWith('/api/services') || 
      pathname.startsWith('/api/hero-slider') || 
      pathname.startsWith('/api/about') || 
      pathname.startsWith('/api/slider')) {
    console.log('Public API rotası tespit edildi, middleware atlanıyor:', pathname);
    return NextResponse.next();
  }
  
  // Şu an URL'nin admin bölümünde miyiz kontrol et
  const isAdminPage = pathname.includes('/admin');
  
  // Admin login sayfası için middleware'i atla
  if (pathname.includes('/admin/login')) {
    return NextResponse.next();
  }
  
  // Sadece admin sayfalarını korumak istiyoruz
  if (!isAdminPage) {
    return NextResponse.next();
  }
  
  // API rotalarını kontrol et ve auth endpoint'ini bypass et
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }
  
  // import-rooms API'si için bypass
  if (pathname.startsWith('/api/admin/import-rooms')) {
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
    '/api/admin/:path*',
    // Tüm API rotaları için - public API'ler middleware içinde filtrelenecek
    '/api/:path*'
  ],
};
