'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaMedal, 
  FaBed, 
  FaUtensils, 
  FaSwimmingPool, 
  FaSpa, 
  FaWifi, 
  FaWhatsapp, 
  FaChevronLeft, 
  FaChevronRight, 
  FaHotel, 
  FaArrowRight,
  FaCoffee 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import HeroSlider from '../components/HeroSlider';
import ScrollAnimationWrapper from '../components/ScrollAnimationWrapper';
import { AnimatedCounter, AnimatedText } from '../../components/micro-interactions/MicroInteractions';
import { getRoomsForLanguage } from '../data/rooms';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

type HomePageProps = {
  lang: string;
};

// Oda kartı bileşeni
const RoomCard = ({ room, language, isActive }: { room: any; language: string; isActive: boolean }) => (
  <motion.div 
    className={`absolute inset-0 flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden ${
      isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ 
      opacity: isActive ? 1 : 0,
      scale: isActive ? 1 : 0.95,
      transition: { duration: 0.6, ease: 'easeOut' }
    }}
  >
    <div className="relative w-full md:w-3/5 h-60 md:h-auto overflow-hidden group">
      <Image
        src={room.image || (room.gallery && room.gallery.length > 0 ? room.gallery[0] : '/images/placeholder.jpg')}
        alt={room.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="transition-all duration-700 group-hover:scale-110 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent opacity-0 md:opacity-100"></div>
      
      {/* Oda Özellikleri */}
      <div className="absolute bottom-4 left-4 hidden md:flex space-x-2">
        {room.features && Array.isArray(room.features) && room.features.slice(0, 3).map((feature: string, i: number) => (
          <motion.span 
            key={i}
            className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded text-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
          >
            {feature}
          </motion.span>
        ))}
      </div>
    </div>
    
    <div className="relative w-full md:w-2/5 p-6 md:p-10 bg-white/95 backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-2xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-300">{room.name}</h3>
          <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-medium">{room.type}</span>
        </div>
        <p className="text-gray-600 mb-6 line-clamp-3">{room.description}</p>
        
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex items-center">
            <FaBed className="text-amber-500 mr-2" />
            <span className="text-gray-700">{room.capacity} {language === 'tr' ? 'Kişi' : 'People'}</span>
          </div>
          <div className="flex items-center">
            <FaWifi className="text-amber-500 mr-2" />
            <span className="text-gray-700">{language === 'tr' ? 'Ücretsiz WiFi' : 'Free WiFi'}</span>
          </div>
        </div>
      </div>
      
      <Link
        href={`/${language}/rooms/${room.id}`}
        className="group inline-flex items-center bg-gray-100 hover:bg-amber-600 text-gray-800 hover:text-white py-3 px-6 rounded-md transition-all duration-300 overflow-hidden relative"
      >
        <span className="relative z-10 flex items-center">
          {language === 'tr' ? 'Detayları Gör' : 'View Details'}
          <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
        </span>
        <span className="absolute bottom-0 left-0 w-0 h-full bg-amber-600 transition-all duration-300 -z-1 group-hover:w-full"></span>
      </Link>
    </div>
  </motion.div>
);

// Hizmet kartı bileşeni
const ServiceCard = ({ service, index, language }: { service: any; index: number; language: string }) => (
  <ScrollAnimationWrapper key={service.id} animation="fadeInUp" delay={0.1 * (index + 1)} once={true}>
    <motion.div 
      className="bg-white rounded-xl shadow-lg border border-gray-100 h-full transition-all duration-500 hover:shadow-2xl overflow-hidden group"
      whileHover={{ 
        y: -10,
        transition: { duration: 0.3 }
      }}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image 
          src={service.image}
          alt={service.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-transform duration-700 group-hover:scale-110 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Servis İsim Etiketi */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-xl font-bold text-white drop-shadow-md">{service.title}</h3>
        </div>
      </div>
      <div className="p-8">
        <div className="mb-6 rounded-full bg-amber-50 w-20 h-20 flex items-center justify-center transform group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
          <div className="text-amber-600 group-hover:text-amber-700 transition-colors duration-300">
            {getIconComponent(service.icon)}
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-amber-600 transition-colors duration-300">{service.title}</h3>
        <p className="text-gray-600 mb-6">{service.description}</p>
        <ul className="space-y-2 mb-6">
          {service.subServices && Array.isArray(service.subServices) && service.subServices.map((subService: string, i: number) => (
            <motion.li 
              key={i} 
              className="flex items-center"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              viewport={{ once: true }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
              <span className="text-gray-600">{subService}</span>
            </motion.li>
          ))}
        </ul>
        <Link 
          href={`/${language}/services#${service.id}`}
          className="text-amber-600 font-medium inline-flex items-center group hover:text-amber-700 transition-colors duration-300"
        >
          <span>{language === 'tr' ? 'Daha Fazla Bilgi' : 'Learn More'}</span>
          <FaArrowRight className="ml-2 text-sm transform group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </motion.div>
  </ScrollAnimationWrapper>
);

// İstatistik kartı bileşeni
const StatCard = ({ stat, index }: { stat: any; index: number }) => (
  <motion.div
    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 relative overflow-hidden group"
    whileHover={{ 
      y: -5,
      boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
      transition: { duration: 0.2 }
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-center mb-4">
        <div className="text-[#169c71] group-hover:text-[#0e7c59] transition-colors duration-300">{getIconComponent(stat.icon)}</div>
      </div>
      <AnimatedCounter
        value={stat.value}
        className="text-4xl font-bold text-center text-gray-800 mb-2"
      />
      <div className="text-gray-600 text-center">{stat.title}</div>
    </div>
    <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-[#169c71]/10 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
  </motion.div>
);

// İkon bileşenini al
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'utensils':
      return <FaUtensils className="w-10 h-10 text-amber-600" />;
    case 'swimming-pool':
      return <FaSwimmingPool className="w-10 h-10 text-amber-600" />;
    case 'spa':
      return <FaSpa className="w-10 h-10 text-amber-600" />;
    case 'coffee':
      return <FaCoffee className="w-10 h-10 text-amber-600" />;
    case 'wifi':
      return <FaWifi className="w-10 h-10 text-amber-600" />;
    default:
      return <FaHotel className="w-10 h-10 text-amber-600" />;
  }
};

export default function HomePage({ lang }: HomePageProps) {
  const language = lang;
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [loadedRooms, setLoadedRooms] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Client-side'da veri yükleme
  useEffect(() => {
    // Client tarafında çalıştığında oda verilerini yükle
    const loadRooms = async () => {
      try {
        // No-store ile veri çekme, API önbelleğini bypass etmek için
        const fetchUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/rooms?t=${Date.now()}` 
          : 'http://localhost:3000/api/rooms';
          
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
        let rooms;
        
        if (data.success) {
          // API'den alınan ham verileri dile göre işle
          rooms = data.data
            .filter((room: any) => room.active)
            .map((room: any) => ({
              id: room.id,
              name: language === 'tr' ? room.nameTR : room.nameEN,
              description: language === 'tr' ? room.descriptionTR : room.descriptionEN,
              image: room.image,
              mainImageUrl: room.mainImageUrl || room.image,
              price: language === 'tr' ? room.priceTR : room.priceEN,
              capacity: room.capacity,
              size: room.size,
              features: language === 'tr' ? room.featuresTR : room.featuresEN,
              gallery: room.gallery,
              type: room.type
            }));
        } else {
          // API hatası durumunda varsayılan fonksiyonu kullan
          rooms = await getRoomsForLanguage(language);
        }
        
        if (Array.isArray(rooms) && rooms.length > 0) {
          console.log('Oda ID\'leri:', rooms.map(room => room.id));
          
          // Her bir odanın detaylarını kontrol et
          rooms.forEach((room, index) => {
            console.log(`Oda ${index + 1} detayları:`, {
              id: room.id,
              name: room.name,
              image: room.image?.substring(0, 30) + '...'
            });
          });
          
          setLoadedRooms(rooms);
        } else {
          console.warn('Yüklenen oda verisi boş veya geçersiz:', rooms);
        }
      } catch (error) {
        console.error('Oda yüklenirken hata oluştu:', error);
        // Hata durumunda yine normal fonksiyonu dene
        try {
          const rooms = await getRoomsForLanguage(language);
          if (Array.isArray(rooms) && rooms.length > 0) {
            setLoadedRooms(rooms);
          }
        } catch (fallbackError) {
          console.error('Yedek oda yükleme işlemi de başarısız oldu:', fallbackError);
        }
      }
    };
    
    loadRooms();
  }, [language]);

  // Servis verilerini getir
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // Doğrudan API'den taze veri çekme
        const timestamp = Date.now();
        const baseUrl = window.location.origin;
        
        // Public API'yi kullan - /api/services
        const response = await fetch(`${baseUrl}/api/services?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Servis verileri alınamadı: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Sadece ilk 3 servis gösterilecek
          const activeServices = data.items.slice(0, 3);
          
          // Dil bazlı dönüşüm yap
          const formattedServices = activeServices.map((item: any) => ({
            id: item.id,
            title: language === 'tr' ? item.titleTR : item.titleEN,
            description: language === 'tr' ? item.descriptionTR : item.descriptionEN,
            image: item.image,
            icon: item.icon,
            subServices: item.subServices || [] // subServices yoksa boş dizi kullan
          }));
          
          setServices(formattedServices);
        } else {
          throw new Error(data.message || 'API hatası');
        }
      } catch (error) {
        console.error('Servis verileri yüklenirken hata:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [language]);

  // Scroll pozisyonunu takip et
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Odalar için otomatik slider
  useEffect(() => {
    if (loadedRooms.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentRoomIndex((prevIndex) => (prevIndex + 1) % loadedRooms.length);
    }, 7000); // 7 saniyede bir
    
    return () => clearInterval(interval);
  }, [loadedRooms]);

  // İstatistik verileri
  const statsData = [
    {
      value: 58,
      title: language === 'tr' ? 'Konforlu Oda' : 'Comfortable Rooms',
      icon: 'bed'
    },
    {
      value: 5000,
      title: language === 'tr' ? 'Mutlu Misafir' : 'Happy Guests',
      icon: 'medal'
    },
    {
      value: 1,
      title: language === 'tr' ? 'Restoran' : 'Restaurants',
      icon: 'utensils'
    },
    {
      value: 2,
      title: language === 'tr' ? 'Kaydıraklı ve Normal Havuz' : 'Slide and Regular Pool',
      icon: 'swimming-pool'
    }
  ];

  // Özellik verileri
  const features = [
    {
      id: 1,
      title: language === 'tr' ? 'Ücretsiz WiFi' : 'Free WiFi',
      description: language === 'tr' 
        ? 'Otelimizin her alanında yüksek hızlı ücretsiz WiFi erişimi.' 
        : 'High-speed free WiFi access throughout our hotel.',
      icon: 'wifi',
      delay: 0.1
    },
    {
      id: 2,
      title: language === 'tr' ? 'Lüks Odalar' : 'Luxury Rooms',
      description: language === 'tr' 
        ? 'Konforlu yataklar ve modern donanıma sahip şık tasarımlı odalar.' 
        : 'Elegantly designed rooms with comfortable beds and modern equipment.',
      icon: 'bed',
      delay: 0.2
    },
    {
      id: 3,
      title: language === 'tr' ? 'Muhteşem Manzara' : 'Amazing View',
      description: language === 'tr' 
        ? 'Doğanın kalbinde eşsiz manzara eşliğinde huzurlu bir konaklama.' 
        : 'A peaceful stay accompanied by a unique view in the heart of nature.',
      icon: 'spa',
      delay: 0.3
    }
  ];

  // Animasyon varyantları
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <>
      {/* Hero Slider Section */}
      <div className="h-screen" style={{marginTop: "0", position: "relative"}}>
        <HeroSlider language={language} />
      </div>

      {/* Diğer bölümler scrolldown olduğunda görünecek */}
      <div className="relative">
        {/* Whatsapp Float Button - Artık global layout'ta olduğu için kaldırıldı */}

        {/* Rooms Section - Enhanced with Glassmorphism */}
        <section className="py-20 bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 pointer-events-none"></div>
          
          {/* Dekoratif Şekiller */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <ScrollAnimationWrapper animation="fadeIn" delay={0.1} once={true}>
              <div className="text-center mb-16">
                <motion.span
                  className="block text-amber-600 text-sm uppercase tracking-wider mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  {language === 'tr' ? 'Konforlu Konaklama' : 'Comfortable Accommodation'}
                </motion.span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                  {language === 'tr' ? 'Odalarımız' : 'Our Rooms'}
                  <motion.span 
                    className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    viewport={{ once: true }}
                  ></motion.span>
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {language === 'tr' 
                    ? 'Modern tasarım ve konforun bir araya geldiği, size özel lüks odalarımızı keşfedin.' 
                    : 'Discover our luxurious rooms where modern design and comfort come together, specially for you.'}
                </p>
              </div>
            </ScrollAnimationWrapper>
            
            {/* Oda Slider */}
            <div className="relative mx-auto max-w-6xl">
              {/* Ana Slider */}
              <div className="overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="relative w-full">
                  {loadedRooms.map((room, index) => {
                    console.log(`Slider oda ${index + 1}:`, room.name, 'ID:', room.id);
                    return (
                      <div 
                        key={room.id}
                        className={`transition-all duration-1500 ease-out transform ${
                          index === currentRoomIndex 
                            ? "opacity-100 translate-x-0 scale-100" 
                            : "opacity-0 absolute top-0 left-0 -translate-x-8 scale-95"
                        }`}
                        style={{ zIndex: index === currentRoomIndex ? 10 : 0 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="relative h-[300px] md:h-[500px]">
                            <Image 
                              src={room.mainImageUrl || room.image}
                              alt={room.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="rounded-tl-2xl rounded-bl-2xl object-cover"
                              priority={index === 0}
                            />
                          </div>
                          <div className="p-6 md:p-12 flex flex-col justify-center">
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">{room.name}</h3>
                            <p className="text-gray-600 mb-6">{room.description}</p>
                            
                            <div className="mb-8">
                              <h4 className="text-lg font-semibold mb-3 text-gray-700">{language === 'tr' ? 'Özellikler' : 'Features'}</h4>
                              <ul className="grid grid-cols-2 gap-3">
                                {room.features && Array.isArray(room.features) && room.features.map((feature: any, i: number) => (
                                  <li key={i} className="flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                    <span className="text-gray-600">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Slider Navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {loadedRooms.map((_, index) => {
                  const setIndex = () => setCurrentRoomIndex(index);
                  return (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentRoomIndex ? "bg-amber-600 w-8" : "bg-gray-300"
                      }`}
                      onClick={setIndex}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  );
                })}
              </div>
              
              {/* Slider Controls */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4 z-20">
                <button 
                  className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-amber-600 shadow-lg hover:bg-white transition-colors duration-300"
                  onClick={() => {
                    setCurrentRoomIndex((prev) => (prev === 0 ? loadedRooms.length - 1 : prev - 1));
                  }}
                  aria-label="Previous slide"
                >
                  <FaChevronLeft />
                </button>
                <button 
                  className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-amber-600 shadow-lg hover:bg-white transition-colors duration-300"
                  onClick={() => {
                    setCurrentRoomIndex((prev) => (prev === loadedRooms.length - 1 ? 0 : prev + 1));
                  }}
                  aria-label="Next slide"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
            
            {/* Tüm Odalara Git Butonu */}
            <div className="text-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={`/${language}/rooms`}
                  className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white py-3 px-8 rounded-md transition-all duration-300 shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {language === 'tr' ? 'Tüm Odaları Görüntüle' : 'View All Rooms'} <FaArrowRight className="ml-2 inline transform group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <span className="absolute top-0 left-0 w-full h-0 bg-amber-500 transition-all duration-300 group-hover:h-full -z-0"></span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white relative">
          {/* Dekoratif Şekiller */}
          <div className="absolute top-40 right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4">
            <ScrollAnimationWrapper animation="fadeIn" delay={0.1} once={true}>
              <div className="text-center mb-16">
                <motion.span
                  className="block text-amber-600 text-sm uppercase tracking-wider mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  {language === 'tr' ? 'Özel Hizmetlerimiz' : 'Our Special Services'}
                </motion.span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                  {language === 'tr' ? 'Hizmetlerimiz' : 'Our Services'}
                  <motion.span 
                    className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    viewport={{ once: true }}
                  ></motion.span>
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {language === 'tr' 
                    ? 'Konforunuz ve memnuniyetiniz için sunduğumuz özel hizmetlerimiz.' 
                    : 'Our special services for your comfort and satisfaction.'}
                </p>
              </div>
            </ScrollAnimationWrapper>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services && services.length > 0 ? services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} language={language} />
              )) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-500">{language === 'tr' ? 'Servis verileri yüklenemedi.' : 'Service data could not be loaded.'}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-[#169c71] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          {/* Dekoratif Elementler */}
          <div className="absolute top-10 left-1/4 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
          <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-white rounded-full opacity-10 blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-10">
              <motion.span
                className="block text-white/80 text-sm uppercase tracking-wider mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                {language === 'tr' ? 'Rakamlarla Doğa Hotel' : 'Doga Hotel in Numbers'}
              </motion.span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block text-white">
                {language === 'tr' ? 'İstatistiklerimiz' : 'Our Statistics'}
                <motion.span 
                  className="absolute bottom-0 left-0 w-full h-1 bg-white"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  viewport={{ once: true }}
                ></motion.span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {statsData.map((stat, index) => (
                <StatCard key={index} stat={stat} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-white to-amber-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-amber-50 to-transparent"></div>
          
          {/* Dekoratif Elementler */}
          <div className="absolute -left-20 top-1/3 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -right-20 bottom-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-100/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              <ScrollAnimationWrapper animation="fadeIn" delay={0.1} once={true}>
                <div className="text-center mb-12">
                  <motion.span
                    className="block text-amber-600 text-sm uppercase tracking-wider mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    {language === 'tr' ? 'Farkımız' : 'Our Difference'}
                  </motion.span>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 relative inline-block">
                    {language === 'tr' ? 'Neden Bizi Tercih Etmelisiniz?' : 'Why Choose Us?'}
                    <motion.span 
                      className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      viewport={{ once: true }}
                    ></motion.span>
                  </h2>
                  <p className="text-gray-600 max-w-3xl mx-auto mt-4">
                    {language === 'tr'
                      ? 'Doğa Hotel, misafirlerine özel deneyimler ve konfor sunan, doğa ile iç içe bir tatil vaat ediyor.'
                      : 'Doga Hotel promises a holiday intertwined with nature, offering special experiences and comfort to its guests.'}
                  </p>
                </div>
              </ScrollAnimationWrapper>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {features.map((feature) => (
                  <ScrollAnimationWrapper
                    key={feature.id}
                    animation="fadeInUp"
                    delay={feature.delay}
                    once={true}
                  >
                    <motion.div 
                      className="bg-white rounded-xl p-8 shadow-lg border border-amber-100/50 h-full hover:shadow-xl transition-all duration-300"
                      whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="mb-6 bg-gradient-to-br from-amber-100 to-amber-50 w-16 h-16 rounded-lg flex items-center justify-center shadow-inner">
                        <div className="text-amber-600">
                          {getIconComponent(feature.icon)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </motion.div>
                  </ScrollAnimationWrapper>
                ))}
              </div>
                
              <div className="mt-12 text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={`/${language}/about`}
                    className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white py-3 px-8 rounded-md transition-all duration-300 shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {language === 'tr' ? 'Daha Fazla Bilgi' : 'Learn More'} <FaArrowRight className="ml-2 inline transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <span className="absolute top-0 left-0 w-full h-0 bg-amber-500 transition-all duration-300 group-hover:h-full -z-0"></span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 bg-amber-600 relative overflow-hidden">
          <div className="absolute inset-0 mix-blend-overlay opacity-10">
            <div className="absolute inset-0 bg-pattern"></div>
          </div>
          
          {/* Dekoratif Şekiller */}
          <motion.div 
            className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full"
            animate={{ 
              x: [0, 10, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full"
            animate={{ 
              x: [0, -10, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="mb-8 lg:mb-0 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {language === 'tr' ? 'Unutulmaz Bir Tatil Deneyimi Sizi Bekliyor' : 'An Unforgettable Holiday Experience Awaits You'}
                </h2>
                <p className="text-white/90 max-w-xl">
                  {language === 'tr'
                    ? 'Sorularınız için bize ulaşın, size yardımcı olmaktan memnuniyet duyarız.'
                    : 'Contact us for your questions, we would be happy to help you.'}
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={`/${language}/contact`}
                  className="inline-flex items-center bg-white hover:bg-gray-100 text-amber-600 hover:text-amber-700 py-3 px-8 rounded-md transition-all duration-300 shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10">
                    {language === 'tr' ? 'İletişime Geçin' : 'Contact Us'} <FaArrowRight className="ml-2 inline transform group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}