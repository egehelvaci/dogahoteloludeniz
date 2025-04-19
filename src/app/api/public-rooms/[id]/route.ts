import { NextResponse } from 'next/server';
import { getPool, executeQuery } from '@/lib/db';

// Dinamik içerik oluşturmak için gerekli export
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// GET - Belirli bir odayı ID'ye göre getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Veritabanı bağlantısını başlat
    getPool();

    // URL'den dil parametresini al
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'tr';
    
    // ID'yi al ve doğrula
    const id = params.id;
    
    // Geçersiz ID kontrolü
    if (!id) {
      console.error('[API:public-rooms/[id]] Geçersiz boş ID');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Geçersiz oda ID'
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
        }
      );
    }
    
    // Statik dosya uzantısı kontrolü
    if (id.match(/\.(jpg|jpeg|png|gif|svg|webp|css|js|ico|woff|woff2|ttf|json|xml)$/i)) {
      console.error(`[API:public-rooms/[id]] Statik dosya uzantılı ID algılandı: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Geçersiz oda ID - statik dosya uzantısı içeriyor'
        },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
        }
      );
    }
    
    console.log(`[API:public-rooms/[id]] Oda ID'si ile sorgu yapılıyor: ${id}, dil: ${lang}`);

    // SQL sorgusu ile odayı ve galerisini al
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
      WHERE r.id = $1
    `;
    
    const result = await executeQuery(query, [id]);
    
    if (result?.rows?.length === 0) {
      console.log(`[API:public-rooms/[id]] Oda bulunamadı: ${id}`);
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
        }
      );
    }
    
    // Oda verisini dönüştür
    const room = result.rows[0];
    console.log(`[API:public-rooms/[id]] Oda bulundu: ${room.id}`);
    
    return NextResponse.json(
      { success: true, data: room },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      }
    );
  } catch (error) {
    console.error('[API:public-rooms/[id]] Oda sorgulama hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Oda alınırken bir hata oluştu',
        error: String(error)
      },
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
