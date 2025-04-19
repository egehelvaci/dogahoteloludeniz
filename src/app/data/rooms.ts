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

// Sabit veriler - sadece fallback olarak kullanılacak (Next.js 15 uyumluluğu için gerekli)
const roomsTR: Room[] = [];
const roomsEN: Room[] = [];

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
      
      // Vercel ortamında çalışırken localhost yerine process.env.VERCEL_URL veya doğrudan kendi domain'imizi kullanalım
      let baseUrl = '';
      
      if (typeof window !== 'undefined') {
        // Tarayıcı ortamındayız, window.location.origin kullanabiliriz
        baseUrl = window.location.origin;
      } else {
        // Sunucu tarafında çalışıyoruz, çevre değişkenlerini kontrol edelim
        if (process.env.VERCEL_URL) {
          // Vercel ortamında çalışıyoruz
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else if (process.env.NEXT_PUBLIC_SITE_URL) {
          // Özel olarak tanımlanmış site URL'si varsa kullanalım
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
        } else {
          // Hala development ortamındayız
          baseUrl = 'http://localhost:3000';
        }
      }
        
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
