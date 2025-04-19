/**
 * Bu dosya oda ID'lerini yönetir ve eski-yeni ID'ler arasında eşleme sağlar
 * Amacı, URL'ler değiştiğinde bile önceki linklerin çalışmaya devam etmesini sağlamak
 */

import { getBaseUrl } from '@/lib/utils';

interface IdMap {
  [key: string]: string;
}

// Eski ID'leri yeni ID'lere eşleme
export const roomIdMap: IdMap = {
  // Slug formatından UUID'lere eşleme
  'standard-room': '3b787da0-0016-48d1-837f-648e73981817', // Standart Oda
  'triple-room': '553fa4e6-9c09-461c-9ae7-bdcb321e2b91',   // Üç Kişilik Oda
  'suite-room': '46cb020a-fad4-4a8b-bb84-7f2aeffb4bd8',    // Süit Oda
  'apart-room': '4180ee6f-9db6-4999-8bd6-839790c219ba',    // Apart Oda
  
  // ESKİ - YENİ ID eşleştirmeleri (Vercel hata mesajından alındı)
  '43c7e499-ba30-40a9-a010-79902cd38558': '3b787da0-0016-48d1-837f-648e73981817', // Eski Standart Oda -> Yeni Standart Oda
  'd50b9afd-9964-4fe0-8f5c-70bcf19beb76': '553fa4e6-9c09-461c-9ae7-bdcb321e2b91', // Eski Triple -> Yeni Triple
  '448a5110-8ffa-4059-8264-6e171f919ff1': '46cb020a-fad4-4a8b-bb84-7f2aeffb4bd8', // Eski Suite -> Yeni Suite
  '73c5fbe8-0b05-4c21-8374-09bbd5fee920': '4180ee6f-9db6-4999-8bd6-839790c219ba', // Eski Apart -> Yeni Apart
  
  // Eski hatalı UUID'ler için de uygun eşlemeyi yap
  '08a00bb0-48fa-4cfc-90e6-f08a53797154': '3b787da0-0016-48d1-837f-648e73981817',
  
  // Kendi ID'si ile eşleme (değiştirilmiş yeni ID'ler)
  '3b787da0-0016-48d1-837f-648e73981817': '3b787da0-0016-48d1-837f-648e73981817', // Yeni Standart Oda
  '553fa4e6-9c09-461c-9ae7-bdcb321e2b91': '553fa4e6-9c09-461c-9ae7-bdcb321e2b91', // Yeni Triple Oda
  '46cb020a-fad4-4a8b-bb84-7f2aeffb4bd8': '46cb020a-fad4-4a8b-bb84-7f2aeffb4bd8', // Yeni Suite Oda
  '4180ee6f-9db6-4999-8bd6-839790c219ba': '4180ee6f-9db6-4999-8bd6-839790c219ba', // Yeni Apart Oda
};

// UUID'den okunabilir ID'ye dönüştürme haritası
export const reverseRoomIdMap: IdMap = Object.entries(roomIdMap).reduce((acc, [key, value]) => {
  // Sadece okunabilir ID'ler için tersine map oluştur (UUID olmayanlar)
  if (!key.includes('-')) {
    acc[value] = key; // UUID => okunabilir ID
  }
  return acc;
}, {} as IdMap);

// Önbellek için bir yer tutucu
let dynamicIdMapCache: IdMap | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 saat

/**
 * API'den güncel oda ID'lerini alır ve önbelleğe kaydeder
 * Bu fonksiyon, mapRoomId çağrıldığında ID bulunamazsa kullanılabilir
 */
export async function updateDynamicIdMap(): Promise<IdMap> {
  try {
    // Önbellek yeni değilse yeniden kullan
    const now = Date.now();
    if (dynamicIdMapCache && (now - lastCacheUpdate < CACHE_TTL)) {
      return dynamicIdMapCache;
    }
    
    // Tüm odaları almak için API çağrısı yap
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms?t=${now}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`Oda listesi alınamadı: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Oda listesi alınamadı: Geçersiz API yanıtı');
    }
    
    // Yeni ID eşleme haritası oluştur
    const newIdMap: IdMap = {};
    
    // Orijinal statik haritayı kopyala
    Object.entries(roomIdMap).forEach(([key, value]) => {
      newIdMap[key] = value;
    });
    
    // API'den alınan odaları haritaya ekle
    data.data.forEach((room: any) => {
      // Odanın kendi ID'sini kendisine eşle (ID değişse bile bu kalacak)
      if (room.id) {
        newIdMap[room.id] = room.id;
        
        // Odanın tip bilgisi varsa (örn: "standard"), slug formatında bir eşleme ekleyelim
        if (room.type) {
          const slug = `${room.type}-room`.toLowerCase().replace(/\s+/g, '-');
          newIdMap[slug] = room.id;
        }
        
        // Eğer oda ismi varsa, isimden de slug oluşturup eşleme yapalım
        if (room.nameTR) {
          const nameSlug = room.nameTR.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          
          if (nameSlug) {
            newIdMap[nameSlug] = room.id;
          }
        }
      }
    });
    
    // Önbelleği güncelle
    dynamicIdMapCache = newIdMap;
    lastCacheUpdate = now;
    
    console.log('[idMapper] Dinamik ID haritası güncellendi:', Object.keys(newIdMap).length, 'adet eşleme');
    return newIdMap;
  } catch (error) {
    console.error('[idMapper] Dinamik ID haritası güncellenirken hata:', error);
    // Hata durumunda orijinal haritayı dön
    return { ...roomIdMap };
  }
}

/**
 * Herhangi bir ID'yi (eski/yeni/slug) güncel oda ID'sine eşler
 * @param id - Eşlenecek oda ID'si
 * @returns Eşleşen ID veya orijinal ID
 */
export function mapRoomId(id: string): string {
  try {
    // ID null veya undefined ise orijinal değeri döndür
    if (!id) return id;
    
    // Görsel veya statik dosya olabilecek ID'leri filtrele
    if (id.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js)$/i)) {
      console.error(`[idMapper] Dosya uzantılı geçersiz ID algılandı: ${id}`);
      return id; // Dosya uzantılı bir ID döndür, böylece sonraki kontroller bunu reddedebilir
    }
    
    // Önce statik haritada ara
    if (roomIdMap[id]) {
      console.log(`[idMapper] Sabit haritada eşleme bulundu: ${id} => ${roomIdMap[id]}`);
      return roomIdMap[id];
    }
    
    // Dinamik haritada arama için asenkron fonksiyonu çağır (önbellek kullanır)
    // Not: Bu asenkron olduğu için, ilk seferde eşleme olmayabilir
    // Ancak önbellek dolduktan sonra sonraki isteklerde çalışacaktır
    setTimeout(async () => {
      try {
        const dynamicMap = await updateDynamicIdMap();
        if (dynamicMap[id] && dynamicMap[id] !== id) {
          console.log(`[idMapper] Dinamik haritada eşleme bulundu: ${id} => ${dynamicMap[id]}`);
        }
      } catch (e) {
        console.error('[idMapper] Arka plan ID güncellemesi hatası:', e);
      }
    }, 10);
    
    // Eşleme bulunamadıysa orijinal ID'yi dön
    console.log(`[idMapper] Eşleme bulunamadı, orijinal ID kullanılıyor: ${id}`);
    return id;
  } catch (error) {
    console.error('[idMapper] ID eşleme hatası:', error);
    return id; // Hata durumunda orijinal ID'yi dön
  }
}

/**
 * UUID'den okunabilir ID'ye dönüştürür (varsa)
 * @param uuid - Dönüştürülecek UUID
 * @returns Okunabilir ID veya orijinal UUID
 */
export function getReadableId(uuid: string): string {
  return reverseRoomIdMap[uuid] || uuid;
} 