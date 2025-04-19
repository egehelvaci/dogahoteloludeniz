import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ortam bağımsız UUID oluşturucu
 * Hem tarayıcıda hem sunucuda çalışır
 */
export function generateUUID(): string {
  // uuid paketi kullanarak UUID oluştur
  // Bu yöntem, crypto.randomUUID() ile yaşanan sorunları çözer
  return uuidv4();
  
  // Not: Aşağıdaki eski kod kaldırıldı çünkü Vercel/Next.js 15'te sorunlara neden oluyordu
  /* 
  // Node.js ortamında veya crypto.randomUUID() destekleniyorsa
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Desteklenmiyorsa, Web API'si olarak kullan
  // @ts-ignore - global.crypto tarayıcıda mevcut
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  
  // Alternatif çözüm: basit UUID oluşturma
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  */
}

// Baz URL alma fonksiyonu 
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Tarayıcı ortamındayız, window.location.origin kullanabiliriz
    const origin = window.location.origin;
    console.log(`[getBaseUrl] Tarayıcı ortamı tespit edildi, origin: ${origin}`);
    return origin;
  } else {
    // Sunucu tarafında çalışıyoruz, çevre değişkenlerini kontrol edelim
    console.log('[getBaseUrl] Sunucu ortamı tespit edildi');
    
    if (process.env.VERCEL_URL) {
      // Vercel ortamında çalışıyoruz
      const url = `https://${process.env.VERCEL_URL}`;
      console.log(`[getBaseUrl] Vercel ortamı tespit edildi: ${url}`);
      return url;
    } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      // Alternatif Vercel URL değişkeni
      const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      console.log(`[getBaseUrl] NEXT_PUBLIC_VERCEL_URL kullanılıyor: ${url}`);
      return url;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      // Özel olarak tanımlanmış site URL'si varsa kullanalım
      console.log(`[getBaseUrl] NEXT_PUBLIC_SITE_URL kullanılıyor: ${process.env.NEXT_PUBLIC_SITE_URL}`);
      return process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      // Hala development ortamındayız
      console.log('[getBaseUrl] Ortam değişkeni bulunamadı, localhost kullanılıyor');
      return 'http://localhost:3000';
    }
  }
}; 