/**
 * Bu dosya eski harf tabanlı oda ID'lerini yeni UUID'lere eşleyen bir haritalama sistemi içerir.
 * Odaların URL'leri değiştirildiğinde eski linklerin çalışmaya devam etmesini sağlar.
 */

interface IdMap {
  [key: string]: string;
}

// Eski ID'leri yeni ID'lere eşleme
export const roomIdMap: IdMap = {
  'standard-room': '43c7e499-ba30-40a9-a010-79902cd38558', // Standart Oda
  'triple-room': 'd50b9afd-9964-4fe0-8f5c-70bcf19beb76',   // Üç Kişilik Oda
  'suite-room': '448a5110-8ffa-4059-8264-6e171f919ff1',    // Süit Oda
  'apart-room': '73c5fbe8-0b05-4c21-8374-09bbd5fee920',    // Apart Oda
  
  // Vercel'den gelen UUID hataları için eklenebilir
  '08a00bb0-48fa-4cfc-90e6-f08a53797154': '43c7e499-ba30-40a9-a010-79902cd38558' // Muhtemelen Standart Oda için
};

/**
 * Eski ID veya benzer olmayan bir UUID'yi doğru mevcut odaya eşler
 * @param id - Eşlenecek oda ID'si
 * @returns Eşleşen doğru ID veya orijinal ID
 */
export function mapRoomId(id: string): string {
  return roomIdMap[id] || id;
} 