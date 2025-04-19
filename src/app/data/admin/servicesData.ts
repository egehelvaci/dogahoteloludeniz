import { v4 as uuidv4 } from 'uuid';
// JSX kullanımını kaldırıp sadece import tanımlamalarını kullanıyoruz
import { IconType } from 'react-icons';
import { FaUtensils, FaSwimmingPool, FaSpa, FaDumbbell, FaConciergeBell, FaWifi, FaParking, FaShuttleVan, FaCoffee, FaGlassCheers } from 'react-icons/fa'; // Corrected: FaConciergeBell
// Removed incorrect import: import { ServiceItem } from '@/app/types/serviceTypes';

// Servis Öğesi Arayüzü (Defined here)
export interface ServiceItem {
  id: string;
  titleTR: string;
  titleEN: string;
  descriptionTR: string;
  descriptionEN: string;
  detailsTR: string[];
  detailsEN: string[];
  image: string;
  images: string[];
  gallery?: string[];
  icon: string; // Icon adı ('utensils', 'swimming-pool' vs.)
  active: boolean;
  order: number;
}

// Site tarafında kullanılacak servis arayüzü
export interface SiteService {
  id: string;
  title: string;
  description: string;
  details: string[];
  image: string;
  images: string[];
  icon: string;
  order: number;
}

// Varsayılan veri - İlk yüklemede kullanılacak
const initialServiceData: ServiceItem[] = [
  {
    id: 'restaurant',
    titleTR: 'Restoran',
    titleEN: 'Restaurant',
    descriptionTR: 'Yerel ve uluslararası lezzetlerin buluştuğu restoranımızda, taze malzemelerle hazırlanmış zengin bir menü sunuyoruz. Sabah kahvaltısından akşam yemeğine kadar, konuklarımıza unutulmaz bir yemek deneyimi yaşatıyoruz.',
    descriptionEN: 'In our restaurant, where local and international flavors meet, we offer a rich menu prepared with fresh ingredients. From breakfast to dinner, we provide our guests with an unforgettable dining experience.',
    detailsTR: [
      'Açık Büfe Kahvaltı', 
      'A La Carte Akşam Yemeği', 
      'Özel Diyet Menüleri', 
      'Yöresel Lezzetler'
    ],
    detailsEN: [
      'Buffet Breakfast', 
      'A La Carte Dinner', 
      'Special Diet Menus', 
      'Local Specialties'
    ],
    image: '/images/restaurant/restaurant1.jpg',
    images: [
      '/images/restaurant/restaurant1.jpg',
      '/images/restaurant/restaurant2.jpg',
      '/images/restaurant/restaurant3.jpg',
      '/images/restaurant/restaurant4.jpg',
      '/images/restaurant/restaurant5.jpg'
    ],
    icon: 'utensils',
    active: true,
    order: 1
  },
  {
    id: 'pool',
    titleTR: 'Havuz',
    titleEN: 'Swimming Pool',
    descriptionTR: 'Açık ve kapalı yüzme havuzlarımızda ferahlamanın ve eğlenmenin tadını çıkarabilirsiniz. Kaydıraklı havuzumuz çocuklar için özel olarak tasarlanmıştır. Her mevsim kullanılabilen havuzlarımız, konuklarımızın rahatı için özenle tasarlanmıştır.',
    descriptionEN: 'You can enjoy refreshing and having fun in our indoor and outdoor swimming pools. Our pool with slides is specially designed for children. Our pools, which can be used in all seasons, are carefully designed for the comfort of our guests.',
    detailsTR: [
      'Isıtmalı Açık Havuz', 
      'Kapalı Havuz', 
      'Çocuk Havuzu', 
      'Kaydıraklı Havuz', 
      'Havuz Bar Servisi'
    ],
    detailsEN: [
      'Heated Outdoor Pool', 
      'Indoor Pool', 
      'Children\'s Pool', 
      'Pool with Slides', 
      'Pool Bar Service'
    ],
    image: '/images/gallery/pool.jpg',
    images: [
      '/images/gallery/pool.jpg',
      '/images/gallery/pool2.jpg',
      '/images/gallery/pool3.jpg',
      '/images/gallery/pool4.jpg',
      '/images/gallery/pool5.jpg',
      '/images/gallery/pool6.jpg',
      '/images/gallery/pool7.jpg',
      '/images/gallery/pool8.jpg',
      '/images/gallery/pool9.jpg'
    ],
    icon: 'swimming-pool',
    active: true,
    order: 2
  }
];

// Baz URL alma fonksiyonu
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Tarayıcı ortamındayız, window.location.origin kullanabiliriz
    return window.location.origin;
  } else {
    // Sunucu tarafında çalışıyoruz, çevre değişkenlerini kontrol edelim
    if (process.env.VERCEL_URL) {
      // Vercel ortamında çalışıyoruz
      return `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      // Özel olarak tanımlanmış site URL'si varsa kullanalım
      return process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      // Hala development ortamındayız
      return 'http://localhost:3000';
    }
  }
};

// API'den servisleri çekme temel fonksiyonu - önbelleklemeyi engellemek için
async function fetchServicesData(): Promise<ServiceItem[]> {
  const timestamp = Date.now(); // Önbelleği kırmak için zaman damgası
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.items : initialServiceData;
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return initialServiceData;
  }
}

// Removed unused caching logic
// let servicesCache: ServiceItem[] | null = null;
// let cacheTimestamp: number = 0;
// const CACHE_TTL = 0;
// const getServiceDataWithCache = async (): Promise<ServiceItem[]> => { ... };

// Önbelleği temizle (veri güncellendiğinde çağrılır) - Keep clearCache if used by update/add/delete
const clearCache = () => {
  console.log('Önbellek temizleniyor...');
  // Removed unused cache variables
  // servicesCache = null;
  // cacheTimestamp = 0;
  
  // LocalStorage kullanımını kaldırdık, doğrudan JSON dosyasına yazıyoruz
};

// Servis verilerini dil bazlı getir (site tarafı) (Return type updated)
export async function getServicesData(lang: string): Promise<SiteService[]> {
  try {
    // Doğrudan public API'den veri çek
    const timestamp = Date.now();
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API hatası');
    }

    // Zaten API aktif servisleri filtreliyor, şimdi sadece dil dönüşümü yapalım (Add types)
    return data.items.map((item: ServiceItem): SiteService => ({
      id: item.id,
      title: lang === 'tr' ? item.titleTR : item.titleEN,
      description: lang === 'tr' ? item.descriptionTR : item.descriptionEN,
      details: lang === 'tr' ? item.detailsTR : item.detailsEN,
      image: item.image,
      images: item.images || [item.image], // Eğer images dizisi yoksa, image'ı dizi olarak kullan
      icon: item.icon,
      order: item.order
    }));
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return []; // Hata durumunda boş dizi döndür
  }
}

// Tüm servis verilerini getir (admin tarafı)
export async function getAllServicesData(): Promise<ServiceItem[]> {
  // Her zaman taze veri çek
  try {
    const timestamp = Date.now(); // Her seferinde benzersiz timestamp ile önbelleği engelle
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/admin/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servis verileri getirilemedi');
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.items.sort((a: ServiceItem, b: ServiceItem) => a.order - b.order);
    } else {
      throw new Error(data.message || 'API hatası');
    }
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return [];
  }
}

// ID'ye göre servis detayı getir (doğrudan API'den)
export async function getServiceById(id: string): Promise<ServiceItem | null> {
  try {
    const timestamp = Date.now();
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/admin/services/${id}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıtı hatalı: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.item : null;
  } catch (error) {
    console.error('Hizmet getirme hatası:', error);
    return null;
  }
}

// Servis öğesini güncelle
export async function updateServiceItem(id: string, service: Partial<ServiceItem>): Promise<ServiceItem | null> {
  try {
    const timestamp = Date.now();
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/admin/services/${id}?t=${timestamp}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(service),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıtı hatalı: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Başarılı olursa önbelleği temizle
    if (data.success) {
      clearCache();
    }
    
    return data.success ? data.item : null;
  } catch (error) {
    console.error('Hizmet güncelleme hatası:', error);
    return null;
  }
}

// Servis galerisi güncelle
export async function updateServiceGallery(id: string, galleryData: { image: string, images: string[] }): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/admin/services/${id}/gallery?t=${timestamp}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(galleryData),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servis galerisi güncellenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis galerisi güncellenemedi');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Servis galerisi güncelleme hatası:', error);
    return false;
  }
}

// Yeni servis ekle
export async function addServiceItem(newItem: Omit<ServiceItem, 'id'>): Promise<ServiceItem | null> {
  try {
    const baseUrl = getBaseUrl();
    
    // Gönderi verilerini hazırla
    const serviceData = {
      ...newItem,
      id: uuidv4()
    };
    
    console.log('Gönderilecek servis verisi:', JSON.stringify(serviceData, null, 2));
    
    // API endpoint'i slash ile bitmeli
    const url = baseUrl + '/api/admin/services/';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData)
    });
    
    console.log('API yanıtı durumu:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API yanıtı hata kodu:', response.status);
      console.error('API yanıt içeriği:', errorText);
      throw new Error(`Servis eklenirken hata oluştu: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      clearCache(); // Önbelleği temizle
      
      // WebSocket bildirimi gönder
      try {
        await fetch(`${baseUrl}/api/websocket/notify?topic=services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'serviceAdded', id: data.id })
        });
      } catch (error) {
        console.warn('WebSocket bildirimi gönderilemedi:', error);
      }
      
      // API sadece id döndürdüğü için serviceData'yı id ile döndür
      return {
        ...serviceData,
        id: data.id || serviceData.id
      };
    } else {
      throw new Error(data.message || 'Servis eklenemedi');
    }
  } catch (error: any) {
    console.error('Servis ekleme hatası:', error);
    throw error; // Hatayı yakalamak yerine fırlat
  }
}

// Servis sil
export async function deleteServiceItem(id: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Servis silinirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (data.success) {
      clearCache(); // Önbelleği temizle
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Servis silme hatası:', error);
    return false;
  }
}

// Servis görünürlüğü değiştir
export async function toggleServiceVisibility(id: string): Promise<boolean> {
  try {
    // Önce mevcut durumu al
    const service = await getServiceById(id);
    if (!service) return false;
    
    // Görünürlüğü tersine çevir
    const response = await updateServiceItem(id, { active: !service.active });
    
    return response !== null;
  } catch (error) {
    console.error('Görünürlük değiştirme hatası:', error);
    return false;
  }
}

// Servis görseli yükle
export async function uploadServiceImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Görsel yüklenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Görsel yüklenemedi');
    }
    
    return data.url;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
}

// Servis görseli ekle
export async function addImageToServiceGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/${id}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imagePath })
    });
    
    if (!response.ok) {
      throw new Error('Servis galerisi güncellenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis galerisi güncellenemedi');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return false;
  }
}

// Servis galerisinden görsel kaldır
export async function removeImageFromServiceGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/admin/services/${id}/gallery?imagePath=${encodeURIComponent(imagePath)}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Servis galerisi güncellenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis galerisi güncellenemedi');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Görsel kaldırma hatası:', error);
    return false;
  }
}

// Çoklu görsel yükle
export async function uploadMultipleServiceImages(files: FileList): Promise<string[]> {
  try {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/upload/multiple`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Çoklu görsel yükleme hatası');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Çoklu görsel yükleme hatası');
    }
    
    return data.urls;
  } catch (error) {
    console.error('Çoklu görsel yükleme hatası:', error);
    throw error;
  }
}

// Servisleri yeniden sırala
export async function reorderServices(items: {id: string, order: number}[]): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/admin/services/reorder?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ items }),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servisler yeniden sıralanırken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servisler yeniden sıralanamadı');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Servis sıralama hatası:', error);
    return false;
  }
}

// Icon seçeneklerini getir
export function getIconOptions() {
  return [
    { value: 'utensils', label: 'Restoran' },
    { value: 'swimming-pool', label: 'Havuz' },
    { value: 'spa', label: 'Spa' },
    { value: 'dumbbell', label: 'Fitness' },
    { value: 'concierge-bell', label: 'Resepsiyon' },
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'parking', label: 'Otopark' },
    { value: 'shuttle-van', label: 'Transfer' },
    { value: 'coffee', label: 'Kahve' },
    { value: 'glass-cheers', label: 'Bar' }
  ];
}

// İkon adına göre ikon bileşeni için fabrika fonksiyonu (Removed unused className)
export function getIconComponent(iconName: string): IconType {
  // İkon adına göre uygun ikonu döndüren bir fabrika fonksiyonu
  const iconMap: Record<string, IconType> = {
    'utensils': FaUtensils,
    'swimming-pool': FaSwimmingPool,
    'spa': FaSpa,
    'dumbbell': FaDumbbell,
    'concierge-bell': FaConciergeBell, // Corrected: FaConciergeBell
    'wifi': FaWifi,
    'parking': FaParking,
    'shuttle-van': FaShuttleVan,
    'coffee': FaCoffee,
    'glass-cheers': FaGlassCheers
  };
  
  return iconMap[iconName] || FaUtensils; // Bulunamazsa varsayılan ikon döndür
}
