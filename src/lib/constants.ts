/**
 * Uygulama için sabit değerler
 */

// Desteklenen domain'ler
export const ALLOWED_DOMAINS = [
  'dogahoteloludeniz.com',
  'www.dogahoteloludeniz.com',
  'dogahoteloludeniz.vercel.app',
  'localhost:3000'
];

// Temel URL
export const PRIMARY_DOMAIN = 'https://dogahoteloludeniz.com';

// API Ayarları
export const API_CACHE_TIME = 60 * 5; // 5 dakika (saniye cinsinden)

// SEO Ayarları
export const DEFAULT_META = {
  title: 'Doğa Hotel Ölüdeniz - Konforda Mükemmellik',
  description: 'Ölüdeniz Doğa Hotel, muhteşem doğal güzellikler ve konforlu odalarıyla sizleri bekliyor. Unutulmaz bir tatil deneyimi için hemen rezervasyon yapın!',
  keywords: 'ölüdeniz, fethiye, doğa hotel, tatil, konaklama, otel, rezervasyon',
  og: {
    type: 'website',
    siteName: 'Doğa Hotel Ölüdeniz',
  }
}; 