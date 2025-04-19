import { NextResponse } from 'next/server';
import { executeQuery, getPool } from '@/lib/db';

// Define a basic interface for Room items based on usage
export interface RoomItem {
  id: string;
  nameTR: string;
  nameEN: string;
  descriptionTR: string;
  descriptionEN: string;
  image: string;
  priceTR: string;
  priceEN: string;
  capacity: number;
  size: number;
  featuresTR: string[];
  featuresEN: string[];
  gallery: string[];
  type: string;
  roomTypeId?: string;
  active: boolean;
  order: number;
}

// Dinamik içerik oluşturulacak
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Cache kullanılmamasını zorla
export async function GET(request: Request) {
  // Veritabanı havuzunu başlat
  getPool();

  // URL'den dil parametresini al
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'tr';
  const includeInactive = url.searchParams.get('includeInactive') === 'true';
  
  console.log(`[API] /api/public-rooms isteği - Dil: ${lang}, includeInactive: ${includeInactive}`);

  try {
    // SQL sorgusunu oluştur - aktif odaları getir (aksi belirtilmedikçe)
    const query = `
      SELECT 
        r.id, 
        r.name_tr as "nameTR", 
        r.name_en as "nameEN", 
        r.description_tr as "descriptionTR", 
        r.description_en as "descriptionEN", 
        r.main_image_url as image, 
        r.main_image_url as "mainImageUrl", 
        r.price_tr as "priceTR", 
        r.price_en as "priceEN", 
        r.capacity, 
        r.size, 
        r.features_tr as "featuresTR", 
        r.features_en as "featuresEN", 
        r.type, 
        r.room_type_id as "roomTypeId",
        r.active, 
        r.order_number as order,
        r.order_number as "orderNumber",
        COALESCE(
          (SELECT json_agg(image_url ORDER BY order_number ASC)
           FROM room_gallery
           WHERE room_id = r.id), 
          '[]'::json
        ) as gallery
      FROM rooms r
      ${includeInactive ? '' : 'WHERE r.active = true'}
      ORDER BY r.order_number ASC
    `;
    
    const result = await executeQuery(query);
    
    // API yanıtı için önbellekleme önleyici başlıklar ekle
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    return NextResponse.json(
      { success: true, data: result.rows },
      { headers }
    );
  } catch (error) {
    console.error('[API] Odalar listesi alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Odalar alınamadı', error: String(error) },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
}
