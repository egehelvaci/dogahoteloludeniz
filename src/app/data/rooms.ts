// Odalar için veri modeli
interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  capacity: number;
  size: number;
  features: string[];
  gallery?: string[];
}

// Admin panelindeki oda verileri ile senkronize olacak fonksiyonlar
import { getRoomsData, getSiteRoomById } from './admin/roomsData'; // Added getSiteRoomById

// Türkçe dil için oda verileri
const roomsTR: Room[] = [
  {
    id: 'standard-room',
    name: 'Standart Oda',
    description: '26 m² olup, çift kişilik yatak mevcuttur. Konforlu bir konaklama deneyimi için tüm ihtiyaçlarınızı karşılayacak donanıma sahiptir.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room.jpg',
    price: '₺1.500',
    capacity: 2,
    size: 26,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room6.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room7.jpg'
    ]
  },
  {
    id: 'triple-room',
    name: 'Üç Kişilik Oda',
    description: '26 m² olup, 1 adet çift kişilik ve 1 adet tek kişilik yatak mevcuttur. Aileler için ideal bir konaklama seçeneğidir.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room.jpg',
    price: '₺2.500',
    capacity: 3,
    size: 26,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room1.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room6.jpg'
    ]
  },
  {
    id: 'suite-room',
    name: 'Süit Oda',
    description: '40 m² olup, 1 adet çift kişilik yatak ve 3 adet tek kişilik yatak mevcuttur. Tek duşlu olup seramik zeminden oluşmaktadır.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room.jpg',
    price: '₺3.500',
    capacity: 5,
    size: 40,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'Mini-Bar',
      'WC & Duşa Kabin',
      'Balkon',
      'Güvenlik Kasası',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room6.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room7.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room8.jpg'
    ]
  },
  {
    id: 'apart-room',
    name: 'Apart Oda',
    description: '30 m² olup, tek duşlu olup seramik zeminden oluşmaktadır. Konforlu bir konaklama için tüm ihtiyaçlarınızı karşılar.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room.jpg',
    price: '₺2.000',
    capacity: 2,
    size: 30,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'Uydu TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room6.jpg'
    ]
  }
];

// İngilizce dil için oda verileri
const roomsEN: Room[] = [
  {
    id: 'standard-room',
    name: 'Standard Room',
    description: '26 m² with a double bed. Equipped with all the amenities for a comfortable stay.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room.jpg',
    price: '€80',
    capacity: 2,
    size: 26,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room6.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/standard-room7.jpg'
    ]
  },
  {
    id: 'triple-room',
    name: 'Triple Room',
    description: '26 m² with 1 double bed and 1 single bed. An ideal accommodation option for families.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room.jpg',
    price: '€120',
    capacity: 3,
    size: 26,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room1.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/triple-room6.jpg'
    ]
  },
  {
    id: 'suite-room',
    name: 'Suite Room',
    description: '40 m² with 1 double bed and 3 single beds. Features a single shower and ceramic floor.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room.jpg',
    price: '€180',
    capacity: 5,
    size: 40,
    features: [
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
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room6.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room7.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/suite-room8.jpg'
    ]
  },
  {
    id: 'apart-room',
    name: 'Apart Room',
    description: '30 m² with a single shower and ceramic floor. Meets all your needs for a comfortable stay.',
    image: 'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room.jpg',
    price: '€100',
    capacity: 2,
    size: 30,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'Satellite TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room2.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room3.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room4.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room5.jpg',
      'https://s3.tebi.io/dogahotelfethiye/uploads/rooms/apart-room6.jpg'
    ]
  }
];

// Dile göre oda verilerini getiren fonksiyon - admin verilerinden çeker
export async function getRoomsForLanguage(lang: string): Promise<Room[]> {
  try {
    const result = await getRoomsData(lang);
    // result'ın dizi olduğundan emin olalım
    if (Array.isArray(result)) {
      return result;
    }
    console.warn('getRoomsData dizi döndürmedi, dizi olarak dönüştürülüyor', result);
    return [];
  } catch (error) {
    console.error('Oda verileri alınırken bir hata oluştu:', error);
    // Hata durumunda yerel verileri döndürelim
    return lang === 'tr' ? roomsTR : roomsEN;
  }
}

// Belirli bir odayı ID'ye göre getiren asenkron fonksiyon
export async function getRoomById(lang: string, id: string): Promise<Room | undefined> {
  try {
    // İthal etmeyi unutmayalım
    const { mapRoomId } = require('./idMapper');
    
    // ID'yi eşle - bu fonksiyon zaten eşleme yapılmış ID için çağrılacak
    // Ancak başka yerlerden doğrudan çağrılması durumu için ekstra kontrol ekleyelim
    const mappedId = mapRoomId(id);
    console.log(`getRoomById çağrıldı: lang=${lang}, id=${id}, mappedId=${mappedId}`);

    // Use the imported getSiteRoomById function
    // Removed: const { getSiteRoomById } = require('./admin/roomsData');

    try {
      const timestamp = Date.now(); // Cache'lemeden kaçınmak için timestamp ekle
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';
        
      const url = `${baseUrl}/api/rooms/${mappedId}?t=${timestamp}`;
      console.log('Direkt API isteği yapılıyor:', url);
      
      // Direkt API'den veriyi almaya çalış
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
        const result = await response.json();
        console.log('API yanıtı:', JSON.stringify(result, null, 2));
        
        if (result.success && result.data) {
          console.log('API\'den doğrudan oda verisi alındı:', result.data.id);
          console.log('Oda verileri (API):', {
            id: result.data.id,
            nameTR: result.data.nameTR, 
            nameEN: result.data.nameEN,
            image: result.data.mainImageUrl || result.data.image,
            gallery: result.data.gallery || [],
            featuresTR: result.data.featuresTR || [],
            featuresEN: result.data.featuresEN || []
          });
          
          // Feature alanları kontrolü
          const features = lang === 'tr' 
            ? (result.data.featuresTR || []) 
            : (result.data.featuresEN || []);
            
          console.log('Özellikler:', features);
          
          // Oda nesnesini oluştur
          const roomData = {
            id: result.data.id,
            name: lang === 'tr' ? result.data.nameTR : result.data.nameEN,
            description: lang === 'tr' ? result.data.descriptionTR : result.data.descriptionEN,
            image: result.data.mainImageUrl || result.data.image,
            price: lang === 'tr' ? result.data.priceTR : result.data.priceEN,
            capacity: result.data.capacity,
            size: result.data.size,
            features: features,
            gallery: result.data.gallery || []
          };
          
          console.log('Oluşturulan oda nesnesi:', roomData);
          return roomData;
        } else {
          console.error('API yanıtı başarısız veya veri yok:', result);
        }
      }
    } catch (apiError) {
      console.error('API üzerinden oda arama hatası:', apiError);
    }
    
    // admin/roomsData'dan getSiteRoomById kullan
    try {
      const room = await getSiteRoomById(lang, id);
      
      if (room) {
        console.log(`Oda başarıyla bulundu: ${room.id}`);
        console.log(`Oda adı: ${room.name}`);
        console.log(`Oda özellikleri: ${room.features && room.features.length} adet`);
        return room;
      }
    } catch (apiError) {
      console.error('admin/roomsData üzerinden oda arama hatası:', apiError);
    }
    
    // Bulunamadıysa veya API hatası varsa, sabit verilerde arayalım
    console.log(`Admin modülünde oda bulunamadı, sabit veriler kontrol ediliyor`);
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    
    // ID'yi normalleştir (URL güvenli hale getir)
    const normalizedId = id.toLowerCase().trim();
    console.log('Normalleştirilmiş ID:', normalizedId);
    
    // Odayı bul
    const staticRoom = rooms.find(room => {
      const roomId = room.id.toLowerCase().trim();
      const matches = roomId === normalizedId;
      console.log(`Oda ID karşılaştırma: ${roomId} === ${normalizedId} => ${matches}`);
      return matches;
    });
    
    console.log('Sabit veriden bulunan oda:', staticRoom?.id || 'Bulunamadı');
    return staticRoom;
  } catch (error) {
    console.error('Oda arama hatası:', error);
    // Hata durumunda yine sabit verilere dönelim
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    return rooms.find(room => room.id.toLowerCase() === id.toLowerCase());
  }
}
