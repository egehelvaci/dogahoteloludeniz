import { v4 as uuidv4 } from 'uuid';

// Oda Öğesi Arayüzü
export interface RoomItem {
  id: string;
  nameTR: string;
  nameEN: string;
  descriptionTR: string;
  descriptionEN: string;
  mainImageUrl?: string;
  image?: string; // Geriye uyumluluk için
  priceTR: string;
  priceEN: string;
  capacity: number;
  size: number;
  featuresTR: string[];
  featuresEN: string[];
  gallery: string[];
  type: string;
  roomTypeId?: string;
  active: boolean;
  orderNumber: number;
  order?: number; // Geriye uyumluluk için
}

// Site tarafında kullanılacak oda arayüzü
export interface SiteRoom {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  capacity: number;
  size: number;
  features: string[];
  gallery: string[];
  type: string;
}


// Varsayılan veri - JSON dosya yoksa ilk yüklemede kullanılacak
const initialRoomData: RoomItem[] = [
  {
    id: 'standard-room',
    nameTR: 'Standart Oda',
    nameEN: 'Standard Room',
    descriptionTR: '26 m² olup, çift kişilik yatak mevcuttur. Konforlu bir konaklama deneyimi için tüm ihtiyaçlarınızı karşılayacak donanıma sahiptir.',
    descriptionEN: '26 m² with a double bed. Equipped with all the amenities for a comfortable stay.',
    image: '/images/rooms/standart/standard-room.jpg',
    priceTR: '₺1.500',
    priceEN: '€80',
    capacity: 2,
    size: 26,
    featuresTR: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    featuresEN: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/standart/standard-room.jpg',
      '/images/rooms/standart/standard-room2.jpg',
      '/images/rooms/standart/standard-room3.jpg',
      '/images/rooms/standart/standard-room4.jpg',
      '/images/rooms/standart/standard-room5.jpg',
      '/images/rooms/standart/standard-room6.jpg',
      '/images/rooms/standart/standard-room7.jpg'
    ],
    type: 'standard',
    active: true,
    orderNumber: 1
  },
  {
    id: 'triple-room',
    nameTR: 'Üç Kişilik Oda',
    nameEN: 'Triple Room',
    descriptionTR: '26 m² olup, 1 adet çift kişilik ve 1 adet tek kişilik yatak mevcuttur. Aileler için ideal bir konaklama seçeneğidir.',
    descriptionEN: '26 m² with 1 double bed and 1 single bed. An ideal accommodation option for families.',
    image: '/images/rooms/triple/triple-room.jpg',
    priceTR: '₺2.500',
    priceEN: '€120',
    capacity: 3,
    size: 26,
    featuresTR: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    featuresEN: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/triple/triple-room.jpg',
      '/images/rooms/triple/triple-room1.jpg',
      '/images/rooms/triple/triple-room3.jpg',
      '/images/rooms/triple/triple-room4.jpg',
      '/images/rooms/triple/triple-room5.jpg',
      '/images/rooms/triple/triple-room6.jpg'
    ],
    type: 'triple',
    active: true,
    orderNumber: 2
  },
  {
    id: 'suite-room',
    nameTR: 'Süit Oda',
    nameEN: 'Suite Room',
    descriptionTR: '40 m² olup, 1 adet çift kişilik yatak ve 3 adet tek kişilik yatak mevcuttur. Tek duşlu olup seramik zeminden oluşmaktadır.',
    descriptionEN: '40 m² with 1 double bed and 3 single beds. Features a single shower and ceramic floor.',
    image: '/images/rooms/suite/suite-room.jpg',
    priceTR: '₺3.500',
    priceEN: '€180',
    capacity: 5,
    size: 40,
    featuresTR: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'Mini-Bar',
      'WC & Duşa Kabin',
      'Balkon',
      'Güvenlik Kasası',
      'Dağ yada Havuz Manzarası'
    ],
    featuresEN: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'Mini-Bar',
      'WC & Shower Cabin',
      'Balcony',
      'Safety Deposit Box',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/suite/suite-room.jpg',
      '/images/rooms/suite/suite-room2.jpg',
      '/images/rooms/suite/suite-room3.jpg',
      '/images/rooms/suite/suite-room4.jpg',
      '/images/rooms/suite/suite-room5.jpg',
      '/images/rooms/suite/suite-room6.jpg',
      '/images/rooms/suite/suite-room7.jpg',
      '/images/rooms/suite/suite-room8.jpg'
    ],
    type: 'suite',
    active: true,
    orderNumber: 3
  },
  {
    id: 'apart-room',
    nameTR: 'Apart Oda',
    nameEN: 'Apart Room',
    descriptionTR: '30 m² olup, tek duşlu olup seramik zeminden oluşmaktadır. Konforlu bir konaklama için tüm ihtiyaçlarınızı karşılar.',
    descriptionEN: '30 m² with a single shower and ceramic floor. Meets all your needs for a comfortable stay.',
    image: '/images/rooms/apart/apart-room.jpg',
    priceTR: '₺2.000',
    priceEN: '€100',
    capacity: 2,
    size: 30,
    featuresTR: [
      'Klima',
      'Saç Kurutma Makinası',
      'Uydu TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    featuresEN: [
      'Air Conditioning',
      'Hair Dryer',
      'Satellite TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/apart/apart-room.jpg',
      '/images/rooms/apart/apart-room2.jpg',
      '/images/rooms/apart/apart-room3.jpg',
      '/images/rooms/apart/apart-room4.jpg',
      '/images/rooms/apart/apart-room5.jpg',
      '/images/rooms/apart/apart-room6.jpg'
    ],
    type: 'apart',
    active: true,
    orderNumber: 4
  }
];

// API'den oda verilerini çekmek için yardımcı fonksiyon
const fetchRoomsData = async (): Promise<RoomItem[]> => {
  try {
    // Tam URL oluşturma - geliştirme veya üretim
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Oda verileri alınamadı');
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('API hatası:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Oda verileri çekilirken hata oluştu:', error);
    return [];
  }
};

// Önbellek için değişken
let roomsCache: RoomItem[] | null = null;

// Oda verilerini getir ve önbelleğe al
const getRoomDataWithCache = async (): Promise<RoomItem[]> => {
  // Önbellekte veri varsa kullan
  if (roomsCache !== null) {
    return roomsCache;
  }
  
  // API'den veri çek
  try {
    const rooms = await fetchRoomsData();
    
    // Önbelleğe al
    roomsCache = rooms;
    
    return rooms;
  } catch (error) {
    console.error('Önbellekli veri çekme hatası:', error);
    return initialRoomData;
  }
};

// Önbelleği temizle (veri güncellendiğinde çağrılır)
const clearCache = () => {
  roomsCache = null;
  console.log('[roomsData] Cache temizlendi! Bir sonraki istekte güncel veriler getirilecek.');
};

// Cache'i zorla temizleme fonksiyonu ekleyelim
export async function forceClearAndFetchRooms() {
  console.log('[roomsData] Cache zorla temizleniyor ve güncel veriler getiriliyor...');
  roomsCache = undefined;
  
  try {
    const response = await fetch('/api/rooms', {
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
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log('[roomsData] Veriler başarıyla güncellendi:', result.data.length + ' oda');
        return { success: true, message: 'Veriler başarıyla güncellendi', data: result.data };
      }
    }
    return { success: false, message: 'Veriler güncellenemedi' };
  } catch (error) {
    console.error('[roomsData] Cache temizleme ve veri yenileme hatası:', error);
    return { success: false, message: 'Hata oluştu: ' + error.message };
  }
}

// Oda verilerini dil seçeneğine göre siteye uygun formatta döndüren fonksiyon (Return type updated)
export async function getRoomsData(lang: string): Promise<SiteRoom[]> {
  try {
    console.log(`getRoomsData çağrıldı, dil: ${lang}`);
    
    // Veri çek
    const rooms: RoomItem[] = await getRoomDataWithCache(); // Add type

    // Dile göre dönüştür (Add types for room and return type)
    return rooms
      .filter((room: RoomItem) => room.active) // Sadece aktif odaları göster
      .map((room: RoomItem): SiteRoom => ({ // Add types for room and return type
        id: room.id,
        name: lang === 'tr' ? room.nameTR : room.nameEN,
        description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
        image: room.image,
        price: lang === 'tr' ? room.priceTR : room.priceEN,
        capacity: room.capacity,
        size: room.size,
        features: lang === 'tr' ? room.featuresTR : room.featuresEN,
        gallery: room.gallery || [], // Ensure gallery is always an array
        type: room.type
      }))
      .sort((a: SiteRoom, b: SiteRoom) => { // Add type for a, b
        // Oda önceliğine göre sırala (Add type for r)
        const roomA = rooms.find((r: RoomItem) => r.id === a.id);
        const roomB = rooms.find((r: RoomItem) => r.id === b.id);
        return (roomA?.orderNumber || 999) - (roomB?.orderNumber || 999);
      });
  } catch (error) {
    console.error('getRoomsData hatası:', error);
    return [];
  }
}

// Tüm oda verilerini döndüren fonksiyon
export async function getAllRoomsData(): Promise<RoomItem[]> {
  try {
    // Veri çek
    return await getRoomDataWithCache();
  } catch (error) {
    console.error('getAllRoomsData hatası:', error);
    return [];
  }
}

// ID'ye göre oda getiren fonksiyon
export async function getRoomById(id: string): Promise<RoomItem | null> {
  try {
    // Veri çek
    const rooms = await getRoomDataWithCache();
    return rooms.find(room => room.id === id) || null;
  } catch (error) {
    console.error('getRoomById hatası:', error);
    return null;
  }
}

// Tek bir odayı API'den getiren fonksiyon
export async function fetchRoomById(id: string): Promise<RoomItem | null> {
  try {
    // Tam URL oluşturma
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    // Timestamp ekleyerek cache'lemeyi önle
    const timestamp = Date.now();
    const url = `${baseUrl}/api/rooms/${id}?t=${timestamp}`;
    
    console.log('API isteği:', url);
    
    const response = await fetch(url, {
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
      throw new Error(`Oda verisi alınamadı: ${id}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('API hatası:', data.message);
      return null;
    }
  } catch (error) {
    console.error(`Oda verileri çekilirken hata oluştu (ID: ${id}):`, error);
    return null;
  }
}

// Site için ID'ye göre formatlanmış oda getiren fonksiyon (Return type updated)
export async function getSiteRoomById(lang: string, id: string): Promise<SiteRoom | null> {
  try {
    console.log(`getSiteRoomById çağrıldı: lang=${lang}, id=${id}`);
    
    // Direkt API'den çekmeyi deneyelim
    try {
      const baseUrl = getBaseUrl();
      
      // Timestamp ekleyerek cache'lemeyi önle
      const timestamp = Date.now();
      const url = `${baseUrl}/api/rooms/${id}?t=${timestamp}`;
      
      console.log('API isteği:', url);
      
      const response = await fetch(url, {
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
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('API\'den oda verisi başarıyla alındı:', data.data.id);
          
          // API'den gelen verileri SiteRoom formatına dönüştür
          const room = data.data;
          
          // Features alanları dizi olduğundan emin ol
          const features = lang === 'tr' 
            ? (Array.isArray(room.featuresTR) ? room.featuresTR : [])
            : (Array.isArray(room.featuresEN) ? room.featuresEN : []);
          
          console.log(`Oda özellikleri (${lang})`, features);
          
          const siteRoom: SiteRoom = {
            id: room.id,
            name: lang === 'tr' ? room.nameTR : room.nameEN,
            description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
            image: room.mainImageUrl || room.image,
            price: lang === 'tr' ? room.priceTR : room.priceEN,
            capacity: room.capacity,
            size: room.size,
            features: features, 
            gallery: Array.isArray(room.gallery) ? room.gallery : [],
            type: room.type
          };
          
          console.log('SiteRoom formatına dönüştürüldü:', {
            id: siteRoom.id,
            name: siteRoom.name,
            featuresCount: siteRoom.features.length,
            galleryCount: siteRoom.gallery.length
          });
          
          return siteRoom;
        }
      }
      console.log('API\'den oda verisi alınamadı, önbellekten denenecek');
    } catch (error) {
      console.error('API isteği hatası:', error);
    }
    
    // API çalışmazsa veya veri yoksa, önbellekten getir
    // Veri çek
    const room = await getRoomById(id);
    
    if (!room) {
      console.log('Oda bulunamadı (cache):', id);
      return null;
    }

    // Features alanları dizi olduğundan emin ol
    const features = lang === 'tr' 
      ? (Array.isArray(room.featuresTR) ? room.featuresTR : [])
      : (Array.isArray(room.featuresEN) ? room.featuresEN : []);
    
    console.log(`Oda özellikleri (${lang}, cache)`, features);
    
    // Dile göre dönüştür (Use SiteRoom type)
    const siteRoom: SiteRoom = {
      id: room.id,
      name: lang === 'tr' ? room.nameTR : room.nameEN,
      description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
      image: room.mainImageUrl || room.image,
      price: lang === 'tr' ? room.priceTR : room.priceEN,
      capacity: room.capacity,
      size: room.size,
      features: features,
      gallery: Array.isArray(room.gallery) ? room.gallery : [], // Ensure gallery is always an array
      type: room.type
    };
    
    console.log('SiteRoom formatına dönüştürüldü (cache):', {
      id: siteRoom.id,
      name: siteRoom.name,
      featuresCount: siteRoom.features.length,
      galleryCount: siteRoom.gallery.length
    });
    
    return siteRoom;
  } catch (error) {
    console.error('getSiteRoomById hatası:', error);
    return null;
  }
}

// Baz URL alma fonksiyonu
const getBaseUrl = (): string => {
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';
};

// Yeni oda ekleme
export async function addRoomItem(newItem: Omit<RoomItem, 'id'>): Promise<RoomItem | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem)
    });
    
    if (!response.ok) {
      throw new Error('Oda eklenemedi');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Önbelleği temizle
      clearCache();
      return data.data;
    } else {
      console.error('API hatası:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Oda ekleme hatası:', error);
    return null;
  }
}

/**
 * Oda verisini günceller
 * @param id Güncellenecek odanın ID'si
 * @param updatedData Güncellenecek veriler
 * @returns Güncelleme sonucu
 */
export const updateRoomItem = async (id: string, updatedData: Partial<RoomItem>): Promise<RoomItem | null> => {
  try {
    console.log('UpdateRoomItem - Güncellenecek oda ID:', id);
    console.log('UpdateRoomItem - Gönderilecek veri:', JSON.stringify(updatedData, null, 2));
    
    // API isteği - veriyi olduğu gibi gönder (page.tsx'te zaten formatlandı)
    const response = await fetch(`/api/rooms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const result = await response.json();
    console.log('UpdateRoomItem - API yanıtı:', result);

    // Başarılı yanıt kontrolü
    if (response.ok && result.success) {
      // Önbelleği temizle
      clearCache();
      return result.data;
    } else {
      console.error('UpdateRoomItem - API başarısız:', result.message || 'Bilinmeyen hata');
      return null;
    }
  } catch (error) {
    console.error('UpdateRoomItem - Hata:', error);
    return null;
  }
};

// Odayı silme
export async function deleteRoomItem(id: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Oda silinemedi: ${id}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Önbelleği temizle
      clearCache();
      return true;
    } else {
      console.error('API hatası:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Oda silme hatası:', error);
    return false;
  }
}

// Odanın görünürlüğünü değiştirme
export async function toggleRoomVisibility(id: string): Promise<boolean> {
  try {
    // Önce odayı getir
    const room = await getRoomById(id);
    
    if (!room) {
      return false;
    }
    
    // Görünürlüğü değiştir
    const updatedRoom = await updateRoomItem(id, { 
      ...room, 
      active: !room.active 
    });
    
    return !!updatedRoom;
  } catch (error) {
    console.error('Oda görünürlüğü değiştirme hatası:', error);
    return false;
  }
}

// Galeriye görsel ekleme
export async function addImageToRoomGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms/gallery/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imagePath })
    });
    
    if (!response.ok) {
      throw new Error(`Görsel eklenemedi: ${id}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Önbelleği temizle
      clearCache();
      return true;
    } else {
      console.error('API hatası:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return false;
  }
}

// Galeriden görsel çıkarma
export async function removeImageFromRoomGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms/gallery/${id}?imagePath=${encodeURIComponent(imagePath)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Görsel kaldırılamadı: ${id}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Önbelleği temizle
      clearCache();
      return true;
    } else {
      console.error('API hatası:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Görsel kaldırma hatası:', error);
    return false;
  }
}

// Odaların sırasını değiştirme
export async function reorderRoomItems(newOrder: {id: string, orderNumber: number}[]): Promise<boolean> {
  try {
    // Tüm odaları getir
    const allRooms = await getAllRoomsData();
    
    // Yeni sırada olmayan odaları yüksek sıraya yerleştir
    const highestOrder = Math.max(...newOrder.map(item => item.orderNumber));
    
    // Her oda için güncelleme yap
    for (const room of allRooms) {
      const orderItem = newOrder.find(item => item.id === room.id);
      
      if (orderItem) {
        // Sırası değişen odaları güncelle
        if (room.orderNumber !== orderItem.orderNumber) {
          await updateRoomItem(room.id, room);
        }
      } else {
        // Sırası belirtilmeyen odaları en sona koy
        await updateRoomItem(room.id, room);
      }
    }
    
    // Önbelleği temizle
    clearCache();
    return true;
  } catch (error) {
    console.error('Oda sırasını değiştirme hatası:', error);
    return false;
  }
}

// Oda galerisini güncelleme
export async function updateRoomGallery(id: string, galleryData: { image: string, gallery: string[] }): Promise<boolean> {
  try {
    console.log('Galeri güncellenecek:', id, {
      mainImageUrl: galleryData.image, 
      galleryCount: galleryData.gallery.length
    });
    
    // UUID ile galeri öğelerini formatlama
    const formattedGallery = galleryData.gallery.map(imageUrl => ({
      id: uuidv4(), // Her galeri öğesi için benzersiz ID
      imageUrl
    }));
    
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/rooms/gallery/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mainImageUrl: galleryData.image,
        gallery: formattedGallery // Formatlı galeri gönder
      })
    });
    
    const responseData = await response.json();
    console.log('Galeri güncelleme yanıtı:', responseData);
    
    if (!response.ok) {
      console.error('API hatası:', response.status, responseData);
      throw new Error(`Galeri güncellenemedi: ${id} - Hata: ${response.status} ${responseData.message || 'Bilinmeyen hata'}`);
    }
    
    if (responseData.success) {
      // Önbelleği temizle
      clearCache();
      return true;
    } else {
      console.error('API hatası:', responseData.message);
      return false;
    }
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return false;
  }
}
