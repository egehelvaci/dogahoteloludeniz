import { cookies } from 'next/headers';

// Kimlik doğrulama cookie'sinin adı
const COOKIE_NAME = 'auth_token';

// Token doğrulama fonksiyonu
export async function verifyToken(token: string) {
  try {
    // Bu basit bir token kontrolü - gerçek uygulamada JWT doğrulaması kullanın
    if (!token) {
      return { verified: false };
    }
    
    // Token formatını kontrol et - basit bir token formatı kullanıyoruz
    // Format: username_timestamp_randomValue
    const parts = token.split('_');
    if (parts.length !== 3) {
      return { verified: false };
    }
    
    const [username, timestampStr] = parts;
    const timestamp = parseInt(timestampStr);
    
    // Token süresi dolmuş mu kontrol et (8 saat)
    const now = Date.now();
    const expirationTime = 8 * 60 * 60 * 1000; // 8 saat (ms cinsinden)
    
    if (now - timestamp > expirationTime) {
      return { verified: false };
    }
    
    return { 
      verified: true,
      username
    };
  } catch (error) {
    console.error('Token doğrulaması sırasında hata:', error);
    return { verified: false };
  }
}

// Mevcut admin kullanıcısını al
export async function getCurrentAdminUser(cookieStore: ReturnType<typeof cookies>) {
  try {
    // Cookie'den token'ı al
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }
    
    // Token'ı doğrula
    const { verified, username } = await verifyToken(token);
    
    if (!verified) {
      return null;
    }
    
    // Basit bir kullanıcı nesnesi döndür
    return {
      username,
      role: 'admin'
    };
  } catch (error) {
    console.error('Admin kullanıcısı alınırken hata:', error);
    return null;
  }
} 