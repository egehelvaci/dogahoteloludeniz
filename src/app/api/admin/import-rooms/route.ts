import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { notifyRoomsUpdated } from '../../websocket/route';
import { v4 as uuidv4 } from 'uuid';

// Tüm API isteklerini dinamik olarak yap
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

// POST - Odaları ekle
export async function GET(request: Request) {
  try {
    console.log("Odaları içe aktarma işlemi başlatılıyor...");
    const results = [];
    
    // Transaction başlat
    const client = await (await executeQuery('BEGIN')).client;
    
    try {
      // Önce mevcut odaları sil
      console.log("Mevcut odaları silme...");
      await client.query('DELETE FROM room_gallery');
      await client.query('DELETE FROM rooms');
      
      // Yeni odaları ekle
      for (const room of rooms) {
        const id = uuidv4();
        console.log(`Oda ekleniyor: ${room.nameTR}`);
        
        // Odayı ekle
        const insertQuery = `
          INSERT INTO rooms (
            id, 
            name_tr, 
            name_en, 
            description_tr, 
            description_en, 
            main_image_url, 
            price_tr, 
            price_en, 
            capacity, 
            size, 
            features_tr, 
            features_en, 
            type, 
            active, 
            order_number,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING *
        `;
        
        const insertValues = [
          id,
          room.nameTR,
          room.nameEN,
          room.descriptionTR,
          room.descriptionEN,
          room.mainImageUrl,
          room.priceTR,
          room.priceEN,
          room.capacity,
          room.size,
          room.featuresTR,
          room.featuresEN,
          room.type,
          room.active,
          room.orderNumber
        ];
        
        const roomResult = await client.query(insertQuery, insertValues);
        const newRoom = roomResult.rows[0];
        
        // Galeri görsellerini ekle
        if (Array.isArray(room.gallery) && room.gallery.length > 0) {
          for (let i = 0; i < room.gallery.length; i++) {
            const galleryId = uuidv4();
            const galleryQuery = `
              INSERT INTO room_gallery (id, room_id, image_url, order_number)
              VALUES ($1, $2, $3, $4)
            `;
            
            await client.query(galleryQuery, [galleryId, id, room.gallery[i], i + 1]);
          }
        }
        
        results.push({
          id,
          nameTR: room.nameTR,
          nameEN: room.nameEN,
          success: true
        });
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyRoomsUpdated();
      
      console.log("Odaları içe aktarma işlemi tamamlandı!");
      
      return NextResponse.json({
        success: true,
        data: results,
        message: "Odalar başarıyla içe aktarıldı"
      });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Odaları içe aktarma hatası:", error);
    return NextResponse.json(
      { success: false, message: "Odaları içe aktarma sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
} 