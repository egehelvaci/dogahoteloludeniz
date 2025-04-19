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
    // Sunucu tarafında çalışıyoruz
    console.log('[getBaseUrl] Sunucu ortamı tespit edildi');
    
    // Vercel production ortamında sabit domain kullan
    const productionUrl = 'https://dogahotelfethiye.vercel.app';
    console.log(`[getBaseUrl] Production URL kullanılıyor: ${productionUrl}`);
    return productionUrl;
  }
}; 