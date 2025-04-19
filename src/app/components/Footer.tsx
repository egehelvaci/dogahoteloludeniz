'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaClock } from 'react-icons/fa';
import { getRoomsForLanguage } from '../data/rooms';
import CookieConsent from './CookieConsent';
import Image from 'next/image';

interface LinkItem {
  title: string;
  path: string;
}

interface FooterProps {
  lang?: string;
}

export default function Footer({ lang: propLang }: FooterProps) {
  const pathname = usePathname();
  const language = propLang || (pathname?.startsWith('/en') ? 'en' : 'tr');
  
  const [roomLinks, setRoomLinks] = useState<LinkItem[]>([]);
  
  // İletişim bilgileri
  const contactInfo = {
    address: language === 'tr' 
      ? 'Ölüdeniz, Ovacık Cd. 85 Sokak No:71, 48300 Fethiye/Muğla'
      : 'Oludeniz, Ovacik St. 85 Street No:71, 48300 Fethiye/Mugla, Turkey',
    phone: '0252 616 61 80',
    email: 'info@dogahoteloludeniz.com',
    whatsapp: '+90 532 066 48 08'
  };
  
  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const rooms = await getRoomsForLanguage(language);
        
        // Oda linklerini oluştur
        const links = rooms.map(room => ({
          title: room.name,
          path: `/${language}/rooms/${room.id}`
        }));
        
        setRoomLinks(links);
      } catch (error) {
        console.error('Footer oda linkleri yüklenirken hata:', error);
        setRoomLinks([]);
      }
    };
    
    loadRoomData();
  }, [language]);
  
  // Diğer linkler
  const quickLinks: LinkItem[] = [
    { title: language === 'tr' ? 'Ana Sayfa' : 'Home', path: `/${language}` },
    { title: language === 'tr' ? 'Hakkımızda' : 'About Us', path: `/${language}/about` },
    { title: language === 'tr' ? 'Odalar' : 'Rooms', path: `/${language}/rooms` },
    { title: language === 'tr' ? 'Galeri' : 'Gallery', path: `/${language}/gallery` },
    { title: language === 'tr' ? 'İletişim' : 'Contact', path: `/${language}/contact` }
  ];

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo ve Açıklama */}
          <div className="mb-6 md:mb-0">
            <Link href={`/${language}`} className="flex items-center mb-4">
              <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center p-2 shadow-md">
                <Image 
                  src="https://s3.tebi.io/dogahotelfethiye/uploads/logo%20%282%29.jpg" 
                  alt="Doğa Hotel Logo" 
                  width={130} 
                  height={130}
                  className="object-contain" 
                  priority
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm md:text-base mb-4 max-w-xs">
              {language === 'tr'
                ? 'Yeşil ve mavinin buluştuğu bir cennet... Doğa Hotel, konforlu odaları, lezzetli mutfağı ve sıcak misafirperverliği ile unutulmaz bir tatil deneyimi sunuyor.'
                : 'A paradise where green meets blue... Doğa Hotel offers an unforgettable holiday experience with comfortable rooms, delicious cuisine and warm hospitality.'}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/share/1AotxqFG16/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF size={18} />
              </a>
              <a
                href="https://www.instagram.com/dogahotel_oludeniz?igsh=bGNlbm5kazEyanB4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
              {language === 'tr' ? 'Hızlı Linkler' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${language}`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {language === 'tr' ? 'Ana Sayfa' : 'Home'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/rooms`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {language === 'tr' ? 'Odalar' : 'Rooms'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/services`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {language === 'tr' ? 'Hizmetler' : 'Services'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/about`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {language === 'tr' ? 'Hakkımızda' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${language}/contact`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {language === 'tr' ? 'İletişim' : 'Contact'}
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim Bilgileri */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
              {language === 'tr' ? 'İletişim' : 'Contact'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className="text-gray-400 mr-3 mt-1" size={16} />
                <span className="text-gray-400 text-sm md:text-base">
                  {contactInfo.address}
                </span>
              </li>
              <li className="flex items-center">
                <FaPhone className="text-gray-400 mr-3" size={16} />
                <a
                  href={`tel:+90${contactInfo.phone.replace(/\s+/g, '').replace(/^0/, '')}`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center">
                <FaWhatsapp className="text-gray-400 mr-3" size={16} />
                <a
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(language === 'tr' ? 'Merhaba, bilgi almak istiyorum.' : 'Hello, I would like to get information.')}`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contactInfo.whatsapp}
                </a>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="text-gray-400 mr-3" size={16} />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center">
                <FaClock className="text-gray-400 mr-3" size={16} />
                <span className="text-gray-400 text-sm md:text-base">
                  {language === 'tr' ? 'Haftanın her günü 24 saat' : '24/7, all days of the week'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Doğa Hotel. {language === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
      <CookieConsent language={language} />
    </footer>
  );
} 