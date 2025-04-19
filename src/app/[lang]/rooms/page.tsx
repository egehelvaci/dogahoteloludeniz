'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { FaBed, FaRulerCombined, FaUsers, FaArrowRight, FaChevronLeft, FaChevronRight, FaCoffee, FaWifi, FaWind, FaTv, FaSearch, FaFilter } from 'react-icons/fa';
import { getRoomsForLanguage } from '../../data/rooms';
import { mapRoomId, getReadableId } from '../../data/idMapper';
import { getBaseUrl } from '@/lib/utils';
import { getDictionary } from '../../dictionaries';

interface RoomsPageProps {
  params: {
    lang: string;
  };
}

export default function RoomsPage({ params }: RoomsPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeImages, setActiveImages] = useState<Record<string, number>>({});
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<any>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      const dict = await getDictionary(lang);
      setDictionary(dict);
    };
    loadDictionary();
  }, [lang]);

  useEffect(() => {
    loadRooms();
  }, [lang]);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const roomsData = await getRoomsForLanguage(lang);
      
      if (!roomsData || roomsData.length === 0) {
        setError(dictionary?.errors?.roomsLoadFailed || 'Odalar yüklenemedi.');
        setRooms([]);
        return;
      }
      
      // Tüm odalar için başlangıç görsel indeksi ayarla
      const initialActiveImages: Record<string, number> = {};
      roomsData.forEach((room: any) => {
        initialActiveImages[room.id] = 0;
      });
      
      setActiveImages(initialActiveImages);
      setRooms(roomsData);
    } catch (err) {
      console.error('Odalar yüklenirken hata oluştu:', err);
      setError(dictionary?.errors?.roomsLoadFailed || 'Odalar yüklenemedi.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

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
  
  // Görsel gezinme fonksiyonları
  const nextImage = (roomId: string) => {
    const room = rooms.find(r => r.id.toString() === roomId.toString());
    if (!room || !room.gallery || room.gallery.length <= 1) return;
    
    setActiveImages(prev => ({
      ...prev,
      [roomId]: (prev[roomId] + 1) % room.gallery.length
    }));
  };

  const prevImage = (roomId: string) => {
    const room = rooms.find(r => r.id.toString() === roomId.toString());
    if (!room || !room.gallery || room.gallery.length <= 1) return;
    
    setActiveImages(prev => ({
      ...prev,
      [roomId]: (prev[roomId] - 1 + room.gallery.length) % room.gallery.length
    }));
  };

  // İşlevsiz render fonksiyonları
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">{dictionary?.common?.loading || 'Yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-20">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!filteredRooms || filteredRooms.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center py-20">
          <p>{dictionary?.rooms?.noRoomsFound || 'Oda bulunamadı.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">{dictionary?.rooms?.title || 'Odalarımız'}</h1>
        
        {/* Filtre ve Arama kısmını kaldırıyorum */}
        
        {/* Odalar Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {filteredRooms.slice(0, 2).map((room) => {
            const readableId = getReadableId(room.id.toString(), lang);
            return (
              <motion.div 
                key={room.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                whileHover={{ y: -5 }}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
              >
                {/* Oda Resim Galerisi */}
                <div className="relative h-64 w-full overflow-hidden group">
                  {/* Ana görsel veya galeri görseli */}
                  {room.gallery && room.gallery.length > 0 ? (
                    <Image 
                      src={room.gallery[activeImages[room.id] || 0]} 
                      alt={room.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                      style={{objectFit: 'cover'}}
                      className="transition-all duration-500"
                      priority={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">{dictionary?.common?.noImage || 'Görsel Yok'}</p>
                    </div>
                  )}
                  
                  {/* Görsel gezinme butonları */}
                  {room.gallery && room.gallery.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          prevImage(room.id);
                        }}
                        className="ml-2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <FaChevronLeft className="text-gray-800" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          nextImage(room.id);
                        }}
                        className="mr-2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <FaChevronRight className="text-gray-800" />
                      </button>
                    </div>
                  )}
                  
                  {/* Görsel sayacı */}
                  {room.gallery && room.gallery.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {(activeImages[room.id] || 0) + 1} / {room.gallery.length}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{room.name}</h2>
                  <p className="text-gray-700 mb-4 line-clamp-2">{room.description}</p>
                  
                  {/* Oda özellikleri */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaRulerCombined className="mr-1" />
                      <span>{room.size} m²</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-1" />
                      <span>{room.capacity} {dictionary?.rooms?.person || 'Kişi'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaBed className="mr-1" />
                      <span>
                        {room.capacity === 1 
                          ? (dictionary?.rooms?.singleBed || 'Tek Kişilik Yatak') 
                          : room.capacity === 2 
                            ? (dictionary?.rooms?.doubleBed || 'Çift Kişilik Yatak')
                            : (dictionary?.rooms?.multipleBeds || 'Çoklu Yatak')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Fiyat bilgisini kaldırıp sadece Detaylar butonu bırakıyorum */}
                  <div className="flex justify-center items-center mt-4">
                    <Link 
                      href={`/${lang}/rooms/${readableId}`}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors duration-300"
                    >
                      <span>{dictionary?.common?.details || 'Detaylar'}</span>
                      <FaArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* İkinci sıradaki odalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredRooms.slice(2, 4).map((room) => {
            const readableId = getReadableId(room.id.toString(), lang);
            return (
              <motion.div 
                key={room.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                whileHover={{ y: -5 }}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
              >
                {/* Oda Resim Galerisi */}
                <div className="relative h-64 w-full overflow-hidden group">
                  {/* Ana görsel veya galeri görseli */}
                  {room.gallery && room.gallery.length > 0 ? (
                    <Image 
                      src={room.gallery[activeImages[room.id] || 0]} 
                      alt={room.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                      style={{objectFit: 'cover'}}
                      className="transition-all duration-500"
                      priority={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">{dictionary?.common?.noImage || 'Görsel Yok'}</p>
                    </div>
                  )}
                  
                  {/* Görsel gezinme butonları */}
                  {room.gallery && room.gallery.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          prevImage(room.id);
                        }}
                        className="ml-2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <FaChevronLeft className="text-gray-800" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          nextImage(room.id);
                        }}
                        className="mr-2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <FaChevronRight className="text-gray-800" />
                      </button>
                    </div>
                  )}
                  
                  {/* Görsel sayacı */}
                  {room.gallery && room.gallery.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {(activeImages[room.id] || 0) + 1} / {room.gallery.length}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{room.name}</h2>
                  <p className="text-gray-700 mb-4 line-clamp-2">{room.description}</p>
                  
                  {/* Oda özellikleri */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaRulerCombined className="mr-1" />
                      <span>{room.size} m²</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-1" />
                      <span>{room.capacity} {dictionary?.rooms?.person || 'Kişi'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaBed className="mr-1" />
                      <span>
                        {room.capacity === 1 
                          ? (dictionary?.rooms?.singleBed || 'Tek Kişilik Yatak') 
                          : room.capacity === 2 
                            ? (dictionary?.rooms?.doubleBed || 'Çift Kişilik Yatak')
                            : (dictionary?.rooms?.multipleBeds || 'Çoklu Yatak')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Fiyat bilgisini kaldırıp sadece Detaylar butonu bırakıyorum */}
                  <div className="flex justify-center items-center mt-4">
                    <Link 
                      href={`/${lang}/rooms/${readableId}`}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors duration-300"
                    >
                      <span>{dictionary?.common?.details || 'Detaylar'}</span>
                      <FaArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
} 