/**
 * Bu dosya eski harf tabanlı oda ID'lerini yeni UUID'lere eşleyen bir haritalama sistemi içerir.
 * Odaların URL'leri değiştirildiğinde eski linklerin çalışmaya devam etmesini sağlar.
 */

interface IdMap {
  [key: string]: string;
}

// Eski ID'leri yeni ID'lere eşleme
export const roomIdMap: IdMap = {
  // Eski okunabilir ID'lerden yeni UUID'lere
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

/**
 * Eski ID veya benzer olmayan bir UUID'yi doğru mevcut odaya eşler
 * @param id - Eşlenecek oda ID'si
 * @returns Eşleşen doğru ID veya orijinal ID
 */
export function mapRoomId(id: string): string {
  // ID null veya undefined ise orijinal değeri döndür
  if (!id) return id;
  
  // Görsel veya statik dosya olabilecek ID'leri filtrele
  if (id.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js)$/i)) {
    console.error(`[idMapper] Dosya uzantılı geçersiz ID algılandı: ${id}`);
    return id; // Dosya uzantılı bir ID döndür, böylece sonraki kontroller bunu reddedebilir
  }
  
  console.log(`[idMapper] Eşleme yapılıyor: ${id} => ${roomIdMap[id] || id}`);
  return roomIdMap[id] || id;
}

/**
 * UUID'den okunabilir ID'ye dönüştürür (varsa)
 * @param uuid - Dönüştürülecek UUID
 * @returns Okunabilir ID veya orijinal UUID
 */
export function getReadableId(uuid: string): string {
  return reverseRoomIdMap[uuid] || uuid;
} 