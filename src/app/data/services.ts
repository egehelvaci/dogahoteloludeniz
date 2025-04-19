import { getBaseUrl } from '../../lib/utils';

// Tüm servisleri dil bazında getir
export async function getServicesForLanguage(lang: string): Promise<any[]> {
  try {
    // BaseUrl'i burada alalım - çoklu domain desteği için
    const baseUrl = getBaseUrl();
    
    // Önbelleği engellemek için timestamp ekle
    const timestamp = Date.now();
    const url = `${baseUrl}/api/services?lang=${lang}&t=${timestamp}`;
    
    console.log(`Servisler için API isteği: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      next: { revalidate: 0 } // Her istekte yeniden doğrula
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Servis API hatası:', response.status, errorText);
      throw new Error(`Servis verileri alınamadı: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis verileri alınamadı');
    }
    
    return data.items || [];
  } catch (error) {
    console.error('Servis verisi getirme hatası:', error);
    return [];
  }
}

// Belirli bir servisi getir
export async function getServiceById(lang: string, id: string): Promise<any> {
  try {
    // BaseUrl'i burada alalım - çoklu domain desteği için
    const baseUrl = getBaseUrl();
    
    // Önbelleği engellemek için timestamp ekle
    const timestamp = Date.now();
    const url = `${baseUrl}/api/services/${id}?lang=${lang}&t=${timestamp}`;
    
    console.log(`Servis detayı için API isteği: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      next: { revalidate: 0 } // Her istekte yeniden doğrula
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Servis detayı API hatası:', response.status, errorText);
      throw new Error(`Servis detayı alınamadı: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis detayı alınamadı');
    }
    
    return data.item || null;
  } catch (error) {
    console.error('Servis detayı getirme hatası:', error);
    return null;
  }
} 