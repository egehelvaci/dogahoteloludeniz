import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notifyRoomsUpdated } from '../../websocket/route';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../../../lib/db';

// Prisma istemcisi oluştur
const prisma = new PrismaClient();

// Tüm API isteklerini dinamik olarak yap
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Middleware'i bypass etmek için
// Bu endpoint'in güvenlik kontrollerini atlaması için
export const skipMiddleware = true;

// Tüm odalar için ortak resim URL'si
const sharedImageUrl = "https://s3.tebi.io/dogahotelfethiye/rooms/43c7e499-ba30-40a9-a010-79902cd38558/23197252-a34c-475f-8875-27ce32b5e1a6.jpg";

// Oda verileri
const rooms = [
  {
    nameTR: "Standart Oda",
    nameEN: "Standard Room",
    descriptionTR: "26 m2 olup, çift kişilik yatak mevcuttur. Odalarda; konforlu bir konaklama için ihtiyacınız olan tüm olanaklar bulunmaktadır.",
    descriptionEN: "26 m² with a double bed. The rooms include all the amenities you need for a comfortable stay.",
    mainImageUrl: sharedImageUrl,
    priceTR: "1.500 ₺",
    priceEN: "€50",
    capacity: 2,
    size: 26,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "standard",
    active: true,
    orderNumber: 1
  },
  {
    nameTR: "Triple Oda",
    nameEN: "Triple Room",
    descriptionTR: "26 m2 olup, Odalarda 1 adet çift kişilik 1 adet tek kişilik yatak mevcuttur. Aile ve arkadaş grupları için ideal konaklama seçeneği.",
    descriptionEN: "26 m² with one double bed and one single bed. An ideal accommodation option for families and groups of friends.",
    mainImageUrl: sharedImageUrl,
    priceTR: "2.000 ₺",
    priceEN: "€70",
    capacity: 3,
    size: 26,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "triple",
    active: true,
    orderNumber: 2
  },
  {
    nameTR: "Suite Oda",
    nameEN: "Suite Room",
    descriptionTR: "40 m2 olup, 1 adet çift kişilik Yatak ve 3 adet tek kişilik yatak mevcuttur. Tek duşlu olup seramik zeminden oluşmaktadır. Geniş aileler için ideal.",
    descriptionEN: "40 m² with one double bed and three single beds. It has a single shower and ceramic flooring. Ideal for large families.",
    mainImageUrl: sharedImageUrl,
    priceTR: "3.000 ₺",
    priceEN: "€100",
    capacity: 5,
    size: 40,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "Mini-Bar",
      "WC & Duşa Kabin",
      "Balkon",
      "Güvenlik Kasası",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "Mini-Bar",
      "WC & Shower Cabin",
      "Balcony",
      "Safe Box",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "suite",
    active: true,
    orderNumber: 3
  },
  {
    nameTR: "Apart Oda",
    nameEN: "Apart Room",
    descriptionTR: "30 m2 olup, tek duşlu olup seramik zeminden oluşmaktadır. Uzun süreli konaklamalar için ideal.",
    descriptionEN: "30 m² with a single shower and ceramic flooring. Ideal for long-term stays.",
    mainImageUrl: sharedImageUrl,
    priceTR: "2.500 ₺",
    priceEN: "€80",
    capacity: 2,
    size: 30,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "Uydu TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "Satellite TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "apart",
    active: true,
    orderNumber: 4
  }
];

// GET - Odaları ekle
export async function GET(request: Request) {
  try {
    console.log("Odaları içe aktarma işlemi başlatılıyor...");
    const results = [];
    
    // Prisma transaction kullan
    await prisma.$transaction(async (tx) => {
      // Önce mevcut odaları sil
      console.log("Mevcut odaları silme...");
      
      // Oda galerilerini sil
      await tx.roomGallery.deleteMany({});
      console.log("Oda galerileri başarıyla silindi");
      
      // Odaları sil
      await tx.room.deleteMany({});
      console.log("Odalar başarıyla silindi");
      
      // Yeni odaları ekle
      for (const room of rooms) {
        const id = uuidv4();
        console.log(`Oda ekleniyor: ${room.nameTR}`);
        
        // Odayı Prisma ile ekle
        const newRoom = await tx.room.create({
          data: {
            id,
            nameTR: room.nameTR,
            nameEN: room.nameEN,
            descriptionTR: room.descriptionTR,
            descriptionEN: room.descriptionEN,
            mainImageUrl: room.mainImageUrl,
            priceTR: room.priceTR,
            priceEN: room.priceEN,
            capacity: room.capacity,
            size: room.size,
            featuresTR: room.featuresTR,
            featuresEN: room.featuresEN,
            type: room.type,
            active: room.active,
            orderNumber: room.orderNumber
          }
        });
        
        console.log(`Oda eklendi: ${newRoom.id}`);
        
        // Galeri görsellerini ekle
        if (Array.isArray(room.gallery) && room.gallery.length > 0) {
          console.log(`${room.gallery.length} adet galeri görseli ekleniyor...`);
          
          for (let i = 0; i < room.gallery.length; i++) {
            const galleryItem = await tx.roomGallery.create({
              data: {
                id: uuidv4(),
                roomId: id,
                imageUrl: room.gallery[i],
                orderNumber: i + 1
              }
            });
            
            console.log(`Galeri görseli eklendi: ${i + 1}/${room.gallery.length}`);
          }
        }
        
        results.push({
          id,
          nameTR: room.nameTR,
          nameEN: room.nameEN,
          success: true
        });
      }
      
      console.log("Odaları içe aktarma işlemi tamamlandı!");
    });
    
    // WebSocket bildirimi gönder
    try {
      notifyRoomsUpdated();
      console.log("WebSocket bildirimleri gönderildi");
    } catch (wsError) {
      console.error("WebSocket bildirimi gönderilirken hata:", wsError);
      // WebSocket hatası işlemi durdurmayacak
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      message: "Odalar başarıyla içe aktarıldı"
    });
  } catch (error) {
    console.error("Odaları içe aktarma hatası:", error);
    console.error("Hata detayları:", JSON.stringify({
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    }, null, 2));
    
    return NextResponse.json(
      { success: false, message: `Odaları içe aktarma sırasında bir hata oluştu: ${error.message}`, error: error.meta || error.message },
      { status: 500 }
    );
  } finally {
    // Bağlantıyı kapat
    await prisma.$disconnect();
  }
} 