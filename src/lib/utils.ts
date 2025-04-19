import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';
import { PRIMARY_DOMAIN, ALLOWED_DOMAINS } from './constants';

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

/**
 * Mevcut ortama göre temel URL'yi belirler
 * - Tarayıcı: window.location.origin
 * - Sunucu & Development: http://localhost:3000
 * - Sunucu & Production: PRIMARY_DOMAIN ('https://dogahoteloludeniz.com')
 */
export function getBaseUrl(): string {
  // Tarayıcı ortamındayız
  if (typeof window !== 'undefined') {
    console.log('UTILS: Tarayıcı ortamı tespit edildi, mevcut adresi kullanıyoruz:', window.location.origin);
    return window.location.origin;
  }
  
  // NODE_ENV'e göre değişecek
  if (process.env.NODE_ENV === 'development') {
    console.log('UTILS: Development ortamı tespit edildi, localhost kullanıyoruz');
    return 'http://localhost:3000';
  }
  
  // Vercel ortamındayız
  if (process.env.VERCEL_URL) {
    const vercelUrl = `https://${process.env.VERCEL_URL}`;
    console.log('UTILS: Vercel ortamı tespit edildi, Vercel URL kullanıyoruz:', vercelUrl);
    return vercelUrl;
  }
  
  // NEXT_PUBLIC_SITE_URL ortam değişkeni varsa onu kullanalım
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    console.log('UTILS: NEXT_PUBLIC_SITE_URL değişkeni tespit edildi:', process.env.NEXT_PUBLIC_SITE_URL);
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Varsayılan değeri constants.ts'den al
  console.log('UTILS: Sunucu ortamı tespit edildi, sabit PRIMARY_DOMAIN kullanıyoruz:', PRIMARY_DOMAIN);
  return PRIMARY_DOMAIN;
}

/**
 * WebSocket bildirimi gönderir
 */
export async function sendNotification(topic: string, data: any, ignoreCache = true): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const timestamp = ignoreCache ? Date.now() : null;
    const url = `${baseUrl}/api/websocket/notify${timestamp ? `?t=${timestamp}` : ''}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        data
      }),
      cache: ignoreCache ? 'no-store' : 'default'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`WebSocket bildirimi gönderme hatası: ${response.status}`, errorText);
      return false;
    }
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('WebSocket bildirimi gönderme hatası:', error);
    return false;
  }
} 