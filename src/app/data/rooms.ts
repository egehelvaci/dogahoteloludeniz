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
import { getRoomsData, getSiteRoomById, RoomItem } from './admin/roomsData'; // Added getSiteRoomById
import { getBaseUrl } from '@/lib/utils'; // Merkezi getBaseUrl fonksiyonunu import et

// Sabit veriler - sadece fallback olarak kullanılacak (Next.js 15 uyumluluğu için gerekli)
const roomsTR: Room[] = [];
const roomsEN: Room[] = [];

// Dile göre oda verilerini getiren fonksiyon - admin verilerinden çeker
export async function getRoomsForLanguage(lang: string): Promise<any[]> {
  const timestamp = Date.now(); // Önbellek sorunlarını önlemek için timestamp
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/rooms?lang=${lang}&timestamp=${timestamp}`;

  console.log(`[getRoomsForLanguage] API isteği yapılıyor: ${url}`);

  try {
    // Fetch options ile cache kontrolü
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      next: { revalidate: 0 }, // Önbelleği devre dışı bırak
    });

    console.log(`[getRoomsForLanguage] API yanıt durumu: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getRoomsForLanguage] API hatası (${response.status}): ${errorText}`);
      return [];
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('[getRoomsForLanguage] API başarısız yanıt döndürdü:', result);
      return [];
    }

    console.log(`[getRoomsForLanguage] ${result.data.length} oda bulundu`);
    
    // Oda verilerini formatla
    return result.data.map((room: any) => {
      const name = lang === 'en' ? room.nameEN : room.nameTR;
      const description = lang === 'en' ? room.descriptionEN : room.descriptionTR;
      const price = lang === 'en' ? room.priceEN : room.priceTR;
      const features = lang === 'en' ? room.featuresEN : room.featuresTR;
      
      return {
        id: room.id,
        name: name || (lang === 'en' ? room.nameTR : room.nameEN), // Fallback mekanizması
        description: description || (lang === 'en' ? room.descriptionTR : room.descriptionEN),
        image: room.mainImageUrl || room.image,
        price: price || (lang === 'en' ? room.priceTR : room.priceEN),
        capacity: room.capacity,
        size: room.size,
        features: features || (lang === 'en' ? room.featuresTR : room.featuresEN),
        gallery: Array.isArray(room.gallery) ? room.gallery : [],
        active: room.active,
        order: room.orderNumber || room.order
      };
    });
  } catch (error) {
    console.error('[getRoomsForLanguage] Oda verileri alınırken hata:', error);
    return [];
  }
}

// Belirli bir odayı ID'ye göre getiren asenkron fonksiyon
export async function getRoomById(lang: string, id: string): Promise<Room | undefined> {
  try {
    // Geçersiz ID kontrolü
    if (!id) {
      console.error(`[getRoomById] Geçersiz boş oda ID'si`);
      return undefined;
    }
    
    // idMapper'dan gelen 'invalid-static-resource' kontrolü
    if (id === 'invalid-static-resource') {
      console.error(`[getRoomById] Statik kaynak ID'si oda ID'si olarak kullanılamaz`);
      return undefined;
    }
    
    // Dosya uzantısı kontrolü - doğrudan burada da yapıyoruz (ek güvenlik için)
    if (id.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js|ico|woff|woff2|ttf|json|xml)$/i)) {
      console.error(`[getRoomById] Geçersiz oda ID formatı (dosya uzantısı içeriyor): ${id}`);
      return undefined;
    }
    
    // İthal etmeyi unutmayalım
    const { mapRoomId } = require('./idMapper');
    
    // ID'yi eşle - bu fonksiyon zaten eşleme yapılmış ID için çağrılacak
    // Ancak başka yerlerden doğrudan çağrılması durumu için ekstra kontrol ekleyelim
    const mappedId = mapRoomId(id);
    
    // Eğer idMapper 'invalid-static-resource' döndürdüyse, bu da geçersizdir
    if (mappedId === 'invalid-static-resource') {
      console.error(`[getRoomById] mapRoomId 'invalid-static-resource' döndürdü`);
      return undefined;
    }
    
    console.log(`[getRoomById] API isteği yapılıyor - Lang: ${lang}, ID: ${id}, MappedID: ${mappedId}`);

    try {
      const timestamp = Date.now(); // Cache'lemeden kaçınmak için timestamp ekle
      
      // Merkezi getBaseUrl fonksiyonunu kullan
      const baseUrl = getBaseUrl();
      
      // API URL'yi oluştur ve tüm parametreleri ekle  
      const url = `${baseUrl}/api/rooms/${mappedId}?lang=${lang}&t=${timestamp}`;
      console.log('[getRoomById] API URL:', url);
      
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
      
      console.log('[getRoomById] API yanıt durumu:', response.status, response.statusText);
      
      // Başarısız yanıt durumunu kontrol et
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
        console.error('API hata detayı:', errorText);
        throw new Error(`API yanıtı başarısız: ${response.status} ${response.statusText}`);
      }
      
      // JSON yanıtını çözümle
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('API yanıtı JSON formatında değil:', jsonError);
        throw new Error('API yanıtı geçerli JSON formatında değil');
      }
      
      // API yanıtını logla
      console.log('API yanıtı:', JSON.stringify(result, null, 2));
      
      // Başarılı yanıt ve data kontrolü
      if (result && result.success === true && result.data) {
        console.log('API\'den doğrudan oda verisi alındı:', result.data.id);
        
        // Oda verilerini logla
        console.log('Oda verileri (API):', {
          id: result.data.id,
          nameTR: result.data.nameTR, 
          nameEN: result.data.nameEN,
          image: result.data.mainImageUrl || result.data.image,
          gallery: result.data.gallery || [],
          featuresTR: result.data.featuresTR || [],
          featuresEN: result.data.featuresEN || []
        });
        
        // Feature alanları kontrolü - feature array dönmezse boş array kullan
        const features = lang === 'tr' 
          ? (Array.isArray(result.data.featuresTR) ? result.data.featuresTR : []) 
          : (Array.isArray(result.data.featuresEN) ? result.data.featuresEN : []);
          
        console.log('Özellikler:', features);
        
        // Oda nesnesini oluştur - tüm alanların var olduğundan emin ol
        const roomData = {
          id: result.data.id || mappedId,
          name: lang === 'tr' 
            ? (result.data.nameTR || 'İsimsiz Oda') 
            : (result.data.nameEN || 'Unnamed Room'),
          description: lang === 'tr' 
            ? (result.data.descriptionTR || '') 
            : (result.data.descriptionEN || ''),
          image: result.data.mainImageUrl || result.data.image || '',
          price: lang === 'tr' 
            ? (result.data.priceTR || '') 
            : (result.data.priceEN || ''),
          capacity: result.data.capacity || 2,
          size: result.data.size || 0,
          features: features,
          gallery: Array.isArray(result.data.gallery) ? result.data.gallery : []
        };
        
        console.log('Oluşturulan oda nesnesi:', roomData);
        return roomData;
      } else {
        console.error('API yanıtı başarısız veya veri yok:', result);
        console.error('API yanıt yapısı:', Object.keys(result || {}));
        if (result && result.message) {
          console.error('API hata mesajı:', result.message);
        }
        throw new Error('API yanıtı başarısız veya veri yok');
      }
    } catch (apiError) {
      console.error('API üzerinden oda arama hatası:', apiError);
      console.error('Hata detayları:', apiError.message);
      // API hatası durumunda alternatif yönteme devam et
    }
    
    // admin/roomsData'dan getSiteRoomById kullan
    try {
      console.log('API başarısız, getSiteRoomById deneniyor...');
      const room = await getSiteRoomById(lang, mappedId);
      
      if (room) {
        console.log(`Oda başarıyla bulundu: ${room.id}`);
        console.log(`Oda adı: ${room.name}`);
        console.log(`Oda özellikleri: ${room.features && room.features.length} adet`);
        return room;
      } else {
        console.log('getSiteRoomById null döndü, statik verilere başvuruluyor');
      }
    } catch (apiError) {
      console.error('admin/roomsData üzerinden oda arama hatası:', apiError);
    }
    
    // Bulunamadıysa veya API hatası varsa, sabit verilerde arayalım
    console.log(`Admin modülünde oda bulunamadı, sabit veriler kontrol ediliyor`);
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    
    // ID'yi normalleştir (URL güvenli hale getir)
    const normalizedId = mappedId.toLowerCase().trim();
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
    console.error('Hata türü:', typeof error);
    console.error('Hata mesajı:', error instanceof Error ? error.message : String(error));
    console.error('Hata stack:', error instanceof Error ? error.stack : 'Stack mevcut değil');
    
    // Hata durumunda yine sabit verilere dönelim
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    return rooms.find(room => room.id.toLowerCase() === id.toLowerCase());
  }
}
