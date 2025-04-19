'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { FaBed, FaRulerCombined, FaUsers, FaArrowRight, FaChevronLeft, FaChevronRight, FaCoffee, FaWifi, FaWind, FaTv, FaSearch, FaFilter } from 'react-icons/fa';
import { getRoomsForLanguage } from '../../data/rooms';
import { mapRoomId } from '../../data/idMapper';
import { getBaseUrl } from '../../lib/utils';

interface RoomsPageProps {
  params: {
    lang: string;
  };
}

export default function RoomsPage({ params }: RoomsPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Her oda için aktif görsel state'i
  const [activeImages, setActiveImages] = useState<{[key: string]: number}>({});
  
  // Odaları asenkron olarak yükle
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        // No-store ile veri çekme, API önbelleğini bypass etmek için
        const baseUrl = getBaseUrl();
        const fetchUrl = `${baseUrl}/api/rooms?t=${Date.now()}`;
          
        const response = await fetch(fetchUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Oda verileri alınamadı');
        }
        
        const data = await response.json();
        let roomsData;
        
        if (data.success) {
          // API'den alınan ham verileri dile göre işle
          roomsData = data.data
            .filter((room: any) => room.active)
            .map((room: any) => ({
              id: room.id,
              name: lang === 'tr' ? room.nameTR : room.nameEN,
              description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
              image: room.image,
              price: lang === 'tr' ? room.priceTR : room.priceEN,
              capacity: room.capacity,
              size: room.size,
              features: lang === 'tr' ? room.featuresTR : room.featuresEN,
              gallery: room.gallery,
              type: room.type
            }));
        } else {
          // API hatası durumunda varsayılan fonksiyonu kullan
          roomsData = await getRoomsForLanguage(lang);
        }
        
        // roomsData'nın bir dizi olduğundan emin olalım
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);
          setFilteredRooms(roomsData);
          
          // Odalar yüklendikten sonra activeImages state'ini oluştur
          if (roomsData.length > 0) {
            const initialActiveImages = roomsData.reduce((acc, room) => ({
              ...acc, 
              [room.id]: 0
            }), {});
            setActiveImages(initialActiveImages);
          } else {
            console.warn('Yüklenen oda verisi boş bir dizi');
            setActiveImages({});
          }
        } else {
          console.error('Hata: roomsData bir dizi değil:', roomsData);
          setRooms([]);
          setFilteredRooms([]);
          setActiveImages({});
        }
      } catch (error) {
        console.error('Odalar yüklenirken hata oluştu:', error);
        setRooms([]);
        setFilteredRooms([]);
        setActiveImages({});
      } finally {
        setLoading(false);
      }
    };
    
    loadRooms();
  }, [lang]);

  // Filtreleme işlemi
  useEffect(() => {
    if (rooms.length === 0) return;

    // Tüm filtreleri uygula
    let result = [...rooms];

    // Oda tipine göre filtrele
    if (activeFilter !== 'all') {
      result = result.filter(room => 
        room.type?.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    // Arama terimine göre filtrele
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      result = result.filter(room => 
        room.name.toLowerCase().includes(search) || 
        room.description.toLowerCase().includes(search)
      );
    }

    setFilteredRooms(result);
  }, [activeFilter, searchTerm, rooms]);
  
  // Önceki görsele geçme fonksiyonu
  const goToPrevious = (roomId: string) => {
    setActiveImages(prev => {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.gallery) return prev;
      
      const currentIndex = prev[roomId];
      const newIndex = currentIndex === 0 ? room.gallery.length - 1 : currentIndex - 1;
      
      return {...prev, [roomId]: newIndex};
    });
  };
  
  // Sonraki görsele geçme fonksiyonu
  const goToNext = (roomId: string) => {
    setActiveImages(prev => {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.gallery) return prev;
      
      const currentIndex = prev[roomId];
      const newIndex = currentIndex === room.gallery.length - 1 ? 0 : currentIndex + 1;
      
      return {...prev, [roomId]: newIndex};
    });
  };
  
  // Oda tipleri
  const roomTypes = Array.from(new Set(rooms.map(room => room.type))).filter(Boolean);
  
  const pageTitle = lang === 'tr' ? 'Odalarımız' : 'Our Rooms';
  const pageDescription = lang === 'tr'
    ? 'Konfor ve lüksün buluştuğu Doğa Hotel odalarında unutulmaz bir konaklama deneyimi yaşayın.'
    : 'Experience an unforgettable stay in Doğa Hotel rooms where comfort and luxury meet.';

  return (
    <>
      {/* Hero Bölümü */}
      <section className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        <Image 
          src="/images/rooms/rooms-hero.jpg"
          alt={pageTitle}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <motion.h1 
            className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4 text-white text-center drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {pageTitle}
          </motion.h1>
          <motion.div 
            className="h-1 w-20 bg-[#169c71] mb-6"
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.p 
            className="text-base md:text-xl text-white/90 max-w-3xl mx-auto text-center mb-8 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {pageDescription}
          </motion.p>
        </div>
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Ana İçerik */}
      <section className="py-12 md:py-16 px-4 bg-white relative">
        <div className="container mx-auto max-w-7xl">
          
          {/* Filtre ve Arama */}
          <motion.div 
            className="mb-8 md:mb-12 p-4 md:p-6 bg-white rounded-xl shadow-xl -mt-10 md:-mt-20 relative z-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center flex-wrap gap-3 md:gap-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="flex items-center text-gray-700 font-medium text-sm md:text-base">
                  <FaFilter className="mr-2 text-[#169c71]" /> 
                  {lang === 'tr' ? 'Filtrele:' : 'Filter:'}
                </span>
                <button 
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                    activeFilter === 'all' 
                      ? 'bg-[#169c71] text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveFilter('all')}
                >
                  {lang === 'tr' ? 'Tümü' : 'All'}
                </button>
                {roomTypes.map(type => (
                  <button 
                    key={type} 
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                      activeFilter === type 
                        ? 'bg-[#169c71] text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setActiveFilter(type as string)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Yükleniyor */}
          {loading && (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#169c71] rounded-full animate-spin"></div>
            </div>
          )}

          {/* Oda bulunamadı */}
          {!loading && filteredRooms.length === 0 && (
            <div className="text-center py-20">
              <Image 
                src="/images/no-results.svg" 
                alt="No results" 
                width={200} 
                height={200} 
                className="mx-auto mb-8"
              />
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                {lang === 'tr' ? 'Oda bulunamadı' : 'No rooms found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {lang === 'tr' 
                  ? 'Arama kriterlerinize uygun oda bulunamadı. Lütfen filtrelerinizi değiştirin.' 
                  : 'No rooms match your search criteria. Please try different filters.'}
              </p>
              <button 
                className="px-6 py-3 bg-[#169c71] text-white rounded-lg hover:bg-[#117a59] transition-colors shadow-md"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchTerm('');
                }}
              >
                {lang === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'}
              </button>
            </div>
          )}
          
          {/* Odalar Listesi */}
          <AnimatePresence mode="wait">
            {!loading && filteredRooms.length > 0 && (
              <motion.div 
                key="roomsGrid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-10"
              >
                {filteredRooms.slice(0, 2).map((room, index) => {
                  const galleryImages = room.gallery?.length > 0 ? room.gallery : [room.image];
                  const activeImageIndex = activeImages[room.id] || 0;
                  
                  return (
                    <motion.div 
                      key={room.id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                    >
                      <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden">
                        {/* Görseller Slider */}
                        {galleryImages.map((image: string, imgIndex: number) => (
                          <motion.div 
                            key={imgIndex}
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ 
                              opacity: imgIndex === activeImageIndex ? 1 : 0,
                              zIndex: imgIndex === activeImageIndex ? 1 : 0
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Image
                              src={image}
                              alt={`${room.name} - ${imgIndex + 1}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
                              className="transition-transform duration-700 group-hover:scale-110 object-cover"
                            />
                          </motion.div>
                        ))}
                        
                        {/* Type badge */}
                        {room.type && (
                          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm z-10">
                            {room.type}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 md:p-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3 group-hover:text-[#169c71] transition-colors">{room.name}</h2>
                        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-5 line-clamp-2">{room.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                          <div className="flex items-center text-gray-700 text-sm md:text-base">
                            <FaUsers className="text-[#169c71] mr-2" />
                            <span>{room.capacity} {lang === 'tr' ? 'Kişi' : 'Persons'}</span>
                          </div>
                          <div className="flex items-center text-gray-700 text-sm md:text-base">
                            <FaRulerCombined className="text-[#169c71] mr-2" />
                            <span>{room.size} m²</span>
                          </div>
                        </div>
                        
                        {/* Özellikler */}
                        <div className="border-t border-gray-100 pt-3 md:pt-4 mb-4 md:mb-5">
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {room.features && Array.isArray(room.features) && room.features.slice(0, 4).map((feature: string, i: number) => (
                              <span key={i} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full text-xs">
                                {feature}
                              </span>
                            ))}
                            {room.features && Array.isArray(room.features) && room.features.length > 4 && (
                              <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full text-xs">
                                +{room.features.length - 4} {lang === 'tr' ? 'daha' : 'more'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Link 
                          href={`/${lang}/rooms/${room.id}`}
                          className="w-full inline-flex items-center justify-center bg-[#169c71] hover:bg-[#117a59] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-colors group/btn shadow-md text-sm md:text-base"
                        >
                          <span className="mr-2">{lang === 'tr' ? 'Detayları Görüntüle' : 'View Details'}</span>
                          <FaArrowRight className="transition-transform duration-300 transform group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* İkinci Sıra - Son İki Oda */}
          <AnimatePresence mode="wait">
            {!loading && filteredRooms.length > 2 && (
              <motion.div 
                key="roomsGrid2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-8"
              >
                {filteredRooms.slice(2, 4).map((room, index) => {
                  const galleryImages = room.gallery?.length > 0 ? room.gallery : [room.image];
                  const activeImageIndex = activeImages[room.id] || 0;
                  
                  return (
                    <motion.div 
                      key={room.id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                      whileHover={{ y: -8 }}
                    >
                      <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden">
                        {/* Görseller Slider */}
                        {galleryImages.map((image: string, imgIndex: number) => (
                          <motion.div 
                            key={imgIndex}
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ 
                              opacity: imgIndex === activeImageIndex ? 1 : 0,
                              zIndex: imgIndex === activeImageIndex ? 1 : 0
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Image
                              src={image}
                              alt={`${room.name} - ${imgIndex + 1}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 50vw, 33vw"
                              className="transition-transform duration-700 group-hover:scale-110 object-cover"
                            />
                          </motion.div>
                        ))}
                        
                        {/* Type badge */}
                        {room.type && (
                          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm z-10">
                            {room.type}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 md:p-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3 group-hover:text-[#169c71] transition-colors">{room.name}</h2>
                        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-5 line-clamp-2">{room.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                          <div className="flex items-center text-gray-700 text-sm md:text-base">
                            <FaUsers className="text-[#169c71] mr-2" />
                            <span>{room.capacity} {lang === 'tr' ? 'Kişi' : 'Persons'}</span>
                          </div>
                          <div className="flex items-center text-gray-700 text-sm md:text-base">
                            <FaRulerCombined className="text-[#169c71] mr-2" />
                            <span>{room.size} m²</span>
                          </div>
                        </div>
                        
                        {/* Özellikler */}
                        <div className="border-t border-gray-100 pt-3 md:pt-4 mb-4 md:mb-5">
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {room.features && Array.isArray(room.features) && room.features.slice(0, 4).map((feature: string, i: number) => (
                              <span key={i} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full text-xs">
                                {feature}
                              </span>
                            ))}
                            {room.features && Array.isArray(room.features) && room.features.length > 4 && (
                              <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full text-xs">
                                +{room.features.length - 4} {lang === 'tr' ? 'daha' : 'more'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Link 
                          href={`/${lang}/rooms/${room.id}`}
                          className="w-full inline-flex items-center justify-center bg-[#169c71] hover:bg-[#117a59] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-colors group/btn shadow-md text-sm md:text-base"
                        >
                          <span className="mr-2">{lang === 'tr' ? 'Detayları Görüntüle' : 'View Details'}</span>
                          <FaArrowRight className="transition-transform duration-300 transform group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-12 md:py-20 bg-[#169c71]/10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {lang === 'tr' ? 'Mükemmel Bir Konaklama İçin Rezervasyon Yapın' : 'Book Your Perfect Stay'}
          </motion.h2>
          <motion.p 
            className="text-base md:text-lg text-gray-600 mb-6 md:mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {lang === 'tr' 
              ? 'Konforlu odalarımızda unutulmaz bir tatil için hemen rezervasyon yapın.' 
              : 'Book now for an unforgettable holiday in our comfortable rooms.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href={`/${lang}/contact`}
              className="bg-[#169c71] hover:bg-[#117a59] text-white px-6 md:px-8 py-3 md:py-4 rounded-lg shadow-lg transition-transform hover:-translate-y-1 text-sm md:text-base"
            >
              {lang === 'tr' ? 'İletişime Geçin' : 'Contact Us'}
            </Link>
            <Link 
              href={`/${lang}/about`}
              className="bg-white hover:bg-gray-50 text-[#169c71] border border-[#169c71] px-6 md:px-8 py-3 md:py-4 rounded-lg shadow-lg transition-transform hover:-translate-y-1 text-sm md:text-base"
            >
              {lang === 'tr' ? 'Hakkımızda' : 'About Us'}
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
} 