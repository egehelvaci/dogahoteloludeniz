import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as crypto from 'crypto';

// JWT Secret - ortam değişkeninden al
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-dogahotel-2025';
const COOKIE_NAME = 'auth_token';

// Kullanıcı kimlik bilgilerini kontrol et
function validateCredentials(username: string, password: string) {
  // Gerçek bir uygulamada, bu bilgiler veritabanından alınmalıdır.
  // Bu örnek için, sabit kullanıcı bilgilerini kullanıyoruz.
  
  // Sabit kullanıcı bilgileri (üretim ortamında asla böyle tutmayın!)
  const ADMIN_USERNAME = 'dogahotel';
  const ADMIN_PASSWORD = 'doga.hotel2025';
  
  // Kullanıcı adını kontrol et
  if (username !== ADMIN_USERNAME) {
    return false;
  }
  
  // Basit şifre karşılaştırması
  return password === ADMIN_PASSWORD;
}

// JWT token oluşturma
function generateToken(username: string) {
  // JWT header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    name: 'Admin User',
    role: 'admin',
    iat: now,
    exp: now + (8 * 60 * 60), // 8 saat geçerli
    jti: crypto.randomBytes(16).toString('hex')
  };
  
  // Base64Url encode header ve payload
  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // İmza oluştur
  const signatureInput = `${headerBase64}.${payloadBase64}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // JWT token
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // Basit validasyon
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Kullanıcı adı ve şifre gereklidir' 
        }, 
        { status: 400 }
      );
    }
    
    // Kullanıcı bilgilerini kontrol et
    const isValid = validateCredentials(username, password);
    
    if (!isValid) {
      // Güvenlik için, hangi bilginin yanlış olduğunu belirtmeyin
      return NextResponse.json(
        { 
          success: false, 
          message: 'Geçersiz kullanıcı adı veya şifre' 
        }, 
        { status: 401 }
      );
    }
    
    // Basit token oluştur
    const token = generateToken(username);

    // Cookie ayarlarını oluştur (await added)
    const cookieStore = await cookies();

    // HttpOnly, Secure ve SameSite özelliklerini açarak güvenliği artır
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Production'da true olmalı
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 saat
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Giriş başarılı' 
    });
    
  } catch (error) {
    console.error('Giriş hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sunucu hatası' 
      }, 
      { status: 500 }
    );
  }
}
// Çıkış yapmak için endpoint
export async function DELETE() {
  // Cookie ayarlarını oluştur (await added)
  const cookieStore = await cookies();

  // Auth cookie'sini sil
  cookieStore.delete(COOKIE_NAME);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Çıkış başarılı' 
  });
}
