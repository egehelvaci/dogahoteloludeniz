import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ortam bağımsız UUID oluşturucu
 * Hem tarayıcıda hem sunucuda çalışır
 */
export function generateUUID(): string {
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
} 