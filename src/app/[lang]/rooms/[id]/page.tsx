import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaUsers, FaRulerCombined, FaCheck, FaBed, FaPhone, FaWhatsapp } from 'react-icons/fa';
import { getRoomById, getRoomsForLanguage } from '../../../data/rooms';
import { mapRoomId } from '../../../data/idMapper';
import RoomGallery from './RoomGallery';
import { getBaseUrl } from '@/lib/utils';

interface RoomDetailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

// Sayfayı tamamen dinamik yapmak için
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  try {
    // Next.js 15'te params Promise olduğu için await ile çözümlüyoruz
    const resolvedParams = await params;
    const lang = resolvedParams.lang;
    const originalId = decodeURIComponent(resolvedParams.id);
    
    console.log(`[RoomDetailPage] Oda detay sayfası yükleniyor - Dil: ${lang}, ID: ${originalId}`);
    
    // Statik varlıklar için genişletilmiş filtre - hem görseller hem de js/css dosyaları
    if (originalId.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js|ico|woff|woff2|ttf)$/i)) {
      console.error(`[RoomDetailPage] Geçersiz oda ID formatı (statik dosya uzantısı içeriyor): ${originalId}`);
      return (
        <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {lang === 'tr' ? 'Geçersiz Oda ID' : 'Invalid Room ID'}
            </h1>
            <p className="text-gray-600 mb-8">
              {lang === 'tr' 
                ? 'Aradığınız oda ID formatı geçersiz. Lütfen oda listesinden geçerli bir oda seçin.' 
                : 'The room ID format you are looking for is invalid. Please select a valid room from the room list.'}
            </p>
            <Link 
              href={`/${lang}/rooms`}
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
            </Link>
          </div>
        </div>
      );
    }
    
    // ID eşleme sistemini kullanarak eski ID'leri yeni UUID'lere dönüştür
    const id = mapRoomId(originalId);
    
    // eşlenen ID 'invalid-static-resource' ise veya tanımsızsa, hata mesajını göster
    if (!id || id === 'invalid-static-resource') {
      console.error(`[RoomDetailPage] Geçersiz ID veya kaynak algılandı: ${originalId} => ${id}`);
      return (
        <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {lang === 'tr' ? 'Geçersiz Oda ID' : 'Invalid Room ID'}
            </h1>
            <p className="text-gray-600 mb-8">
              {lang === 'tr' 
                ? 'Aradığınız oda ID formatı geçersiz veya tanımlanmamış.' 
                : 'The room ID format you are looking for is invalid or undefined.'}
            </p>
            <Link 
              href={`/${lang}/rooms`}
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
            </Link>
          </div>
        </div>
      );
    }
    
    console.log('[RoomDetailPage] ID Bilgileri:', {
      orijinalId: originalId,
      eşlenenId: id,
      baseUrl: getBaseUrl()
    });
    
    // UUID olmayan bir slug için (örneğin, standard-room), doğrudan UUID kullan
    let roomId = id;
    
    // Yaygın oda slug'larını UUID ile eşleştirmeyi dene
    if (id === 'standard-room') {
      roomId = '3b787da0-0016-48d1-837f-648e73981817';
      console.log(`[RoomDetailPage] Oda slug'u UUID ile değiştirildi: ${id} => ${roomId}`);
    } else if (id === 'triple-room') {
      roomId = '553fa4e6-9c09-461c-9ae7-bdcb321e2b91';
      console.log(`[RoomDetailPage] Oda slug'u UUID ile değiştirildi: ${id} => ${roomId}`);
    } else if (id === 'suite-room') {
      roomId = '46cb020a-fad4-4a8b-bb84-7f2aeffb4bd8';
      console.log(`[RoomDetailPage] Oda slug'u UUID ile değiştirildi: ${id} => ${roomId}`);
    } else if (id === 'apart-room') {
      roomId = '4180ee6f-9db6-4999-8bd6-839790c219ba';
      console.log(`[RoomDetailPage] Oda slug'u UUID ile değiştirildi: ${id} => ${roomId}`);
    }
    
    // İlk olarak tüm odaları getirmeyi dene
    let allRooms = [];
    try {
      console.log('[RoomDetailPage] Tüm odalar yükleniyor...');
      allRooms = await getRoomsForLanguage(lang);
      console.log(`[RoomDetailPage] ${allRooms.length} oda bulundu:`, 
        allRooms.map(room => `${room.id} (${room.name})`).join(', '));
    } catch (roomsError) {
      console.error('[RoomDetailPage] Odalar yüklenirken hata:', roomsError);
    }
    
    // Direkt fetch ile API çağrısı yaparak alternatif bir yöntem deneyelim
    console.log(`[RoomDetailPage] Direkt API isteği başlatılıyor - ID: ${roomId}`);
    let room;
    
    // Eğer roomId UUID formatındaysa direkt getir, değilse try-catch içinde dene
    if (roomId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        const baseUrl = getBaseUrl();
        const timestamp = Date.now();
        const apiUrl = `${baseUrl}/api/public-rooms/${roomId}?lang=${lang}&t=${timestamp}`;
        console.log('[RoomDetailPage] API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
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
        
        console.log('[RoomDetailPage] API yanıt durumu:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[RoomDetailPage] API hatası:', response.status, errorText);
          throw new Error(`API yanıtı başarısız: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          room = {
            id: result.data.id,
            name: lang === 'tr' ? result.data.nameTR : result.data.nameEN,
            description: lang === 'tr' ? result.data.descriptionTR : result.data.descriptionEN,
            image: result.data.image || result.data.mainImageUrl,
            price: lang === 'tr' ? result.data.priceTR : result.data.priceEN,
            capacity: result.data.capacity,
            size: result.data.size,
            features: lang === 'tr' ? result.data.featuresTR : result.data.featuresEN,
            gallery: result.data.gallery || []
          };
          console.log('[RoomDetailPage] API ile oda başarıyla alındı:', room.id);
        } else {
          console.error('[RoomDetailPage] API başarılı yanıt vermedi:', result);
        }
      } catch (directApiError) {
        console.error('[RoomDetailPage] Direkt API çağrısında hata:', directApiError);
      }
    } else {
      // UUID olmayan ID'ler için, doğrudan getRoomById metodunu kullan
      console.log('[RoomDetailPage] UUID olmayan ID formatı, alternatif metod kullanılıyor');
    }
    
    // Eğer direkt API çağrısı başarısız olduysa, normal metodu kullan
    if (!room) {
      console.log(`[RoomDetailPage] Alternatif getRoomById metodu deneniyor (ID: ${roomId})...`);
      try {
        room = await getRoomById(lang, roomId);
        console.log('[RoomDetailPage] Alternatif metod sonucu:', room ? 'Oda bulundu' : 'Oda bulunamadı');
      } catch (roomError) {
        console.error('[RoomDetailPage] Alternatif metod hatası:', roomError);
      }
    }
    
    // Hala oda bulunamadıysa, slug ile deneme yap (standard-room gibi)
    if (!room && originalId !== roomId) {
      console.log(`[RoomDetailPage] Orijinal ID ile tekrar deneniyor: ${originalId}`);
      try {
        room = await getRoomById(lang, originalId);
        console.log('[RoomDetailPage] Orijinal ID ile sonuç:', room ? 'Oda bulundu' : 'Oda bulunamadı');
      } catch (fallbackError) {
        console.error('[RoomDetailPage] Orijinal ID ile hata:', fallbackError);
      }
    }
    
    // Yukarıdaki tüm denemelere rağmen oda bulunamadıysa, odalar listesinden manuel olarak ara
    if (!room && allRooms.length > 0) {
      console.log('[RoomDetailPage] Tüm yöntemler başarısız oldu, odalar listesinde aranıyor...');
      
      // Hem ID'ye hem de slug'a göre ara
      const foundRoom = allRooms.find(r => 
        r.id === roomId || 
        r.id === originalId ||
        (r.type && r.type.toLowerCase() === originalId.replace('-room', '')) ||
        (r.name && r.name.toLowerCase().includes(originalId.replace('-room', '')))
      );
      
      if (foundRoom) {
        console.log('[RoomDetailPage] Odalar listesinde eşleşme bulundu:', foundRoom.id);
        room = foundRoom;
      }
    }
    
    // Oda bulunamadıysa
    if (!room) {
      return (
        <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {lang === 'tr' ? 'Oda Bulunamadı' : 'Room Not Found'}
            </h1>
            <p className="text-gray-600 mb-8">
              {lang === 'tr' 
                ? 'Aradığınız oda bulunamadı veya kaldırılmış olabilir.' 
                : 'The room you are looking for could not be found or may have been removed.'}
            </p>
            <div className="bg-gray-100 p-5 rounded-lg mb-8 overflow-auto text-left">
              <p className="text-gray-700 mb-2 font-semibold">Hata ayıklama bilgileri:</p>
              <p className="text-gray-700">
                {lang === 'tr' 
                  ? `Orijinal ID: ${originalId}` 
                  : `Original ID: ${originalId}`}
              </p>
              <p className="text-gray-700">
                {lang === 'tr' 
                  ? `Eşlenen ID: ${id}` 
                  : `Mapped ID: ${id}`}
              </p>
              <p className="text-gray-700">
                {lang === 'tr' 
                  ? `URL: ${typeof window !== 'undefined' ? window.location.href : ''}` 
                  : `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`}
              </p>
              <p className="text-gray-700">
                {lang === 'tr' 
                  ? `Mevcut Odalar: ${allRooms.map(r => `${r.id} (${r.name})`).join(', ')}` 
                  : `Available Rooms: ${allRooms.map(r => `${r.id} (${r.name})`).join(', ')}`}
              </p>
            </div>
            <Link 
              href={`/${lang}/rooms`}
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
            </Link>
          </div>
        </div>
      );
    }

    // Oda görselleri
    const galleryImages = room.gallery || [room.image];
    
    // Yatak bilgisini oluştur
    const getBedInfo = () => {
      if (room.capacity <= 2) {
        return lang === 'tr' ? 'Çift kişilik yatak' : 'Double bed';
      } else if (room.capacity === 3) {
        return lang === 'tr' ? '1 çift kişilik, 1 tek kişilik yatak' : '1 double bed, 1 single bed';
      } else {
        return lang === 'tr' ? 'Çoklu yatak düzeni' : 'Multiple bed arrangement';
      }
    };

    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Geri Düğmesi */}
          <div className="mb-8">
            <Link 
              href={`/${lang}/rooms`}
              className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Tüm Odalar' : 'All Rooms'}
            </Link>
          </div>
          
          {/* Oda Başlık */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
            {room.name}
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Sol Taraf - Oda Görselleri Slider */}
            <div className="aspect-[4/3] relative rounded-xl overflow-hidden shadow-xl">
              <RoomGallery 
                images={galleryImages} 
                roomName={room.name} 
                lang={lang}
              />
            </div>
            
            {/* Sağ Taraf - Oda Bilgileri */}
            <div className="flex flex-col">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <p className="text-gray-700 mb-6">{room.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaRulerCombined className="text-teal-600 mr-2 text-xl" />
                      <div>
                        <p className="text-sm text-gray-500">{lang === 'tr' ? 'Oda Boyutu' : 'Room Size'}</p>
                        <p className="font-semibold">{room.size} m²</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaUsers className="text-teal-600 mr-2 text-xl" />
                      <div>
                        <p className="text-sm text-gray-500">{lang === 'tr' ? 'Kapasite' : 'Capacity'}</p>
                        <p className="font-semibold">{room.capacity} {lang === 'tr' ? 'Kişi' : 'Persons'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg col-span-2">
                    <div className="flex items-center">
                      <FaBed className="text-teal-600 mr-2 text-xl" />
                      <div>
                        <p className="text-sm text-gray-500">{lang === 'tr' ? 'Yatak' : 'Bed'}</p>
                        <p className="font-semibold">{getBedInfo()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{lang === 'tr' ? 'Oda Özellikleri' : 'Room Features'}</h3>
                <ul className="grid grid-cols-1 gap-y-3">
                  {room.features.map((feature, index) => (
                    <li key={index} className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <FaCheck className="text-teal-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-auto">
                <a 
                  href="tel:+905320664808" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 font-medium shadow-lg flex items-center justify-center"
                >
                  <FaPhone className="mr-2" />
                  {lang === 'tr' ? 'Rezervasyon Yap' : 'Book Now'}
                </a>
                <a 
                  href={`https://wa.me/905320664808?text=${encodeURIComponent(lang === 'tr' ? 'Merhaba, Rezarvasyon hakkında bilgi almak istiyorum' : 'Hello, I would like to get information about reservation')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 font-medium shadow-lg flex items-center justify-center"
                >
                  <FaWhatsapp className="mr-2 text-lg" />
                  {lang === 'tr' ? 'WhatsApp ile Bilgi Al' : 'Get Info via WhatsApp'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Oda detay sayfasında hata:', error);
    console.error('Hata türü:', typeof error);
    console.error('Hata mesajı:', error.message);
    console.error('Hata stack:', error.stack);
    
    // Hata durumunda kullanıcıya anlamlı bir mesaj göster
    return (
      <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {params.lang === 'tr' ? 'Bir Hata Oluştu' : 'An Error Occurred'}
          </h1>
          <p className="text-gray-600 mb-8">
            {params.lang === 'tr' 
              ? 'Oda bilgileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.' 
              : 'There was a problem loading the room information. Please try again later.'}
          </p>
          <div className="bg-gray-100 p-5 rounded-lg mb-8 max-w-lg mx-auto text-left">
            <p className="text-red-600 font-semibold">Error: {error.message}</p>
          </div>
          <Link 
            href={`/${params.lang}/rooms`}
            className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
          >
            <FaArrowLeft className="mr-2" />
            {params.lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
          </Link>
        </div>
      </div>
    );
  }
}
