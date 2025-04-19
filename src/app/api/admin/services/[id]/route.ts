import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Client arayüzü tanımlaması
interface DbClient {
  query: (query: string, params?: unknown[]) => Promise<any>;
  release: () => void;
}

interface ExecuteQueryResult {
  rows?: any[];
  rowCount?: number;
  client?: DbClient;
}

// GET - Belirli bir servisi ID'ye göre getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Next.js 15'te parametreler Promise olarak geliyor
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const query = `
      SELECT 
        s.id,
        s.title_tr as "titleTR",
        s.title_en as "titleEN",
        s.description_tr as "descriptionTR",
        s.description_en as "descriptionEN",
        s.main_image_url as image,
        s.main_image_url as "mainImageUrl",
        s.order_number as order,
        s.active,
        s.details_tr as "detailsTR",
        s.details_en as "detailsEN",
        COALESCE(
          (SELECT json_agg(sg.image_url ORDER BY sg.order_number)
           FROM service_gallery sg
           WHERE sg.service_id = s.id),
          '[]'::json
        ) as gallery
      FROM services s
      WHERE s.id = $1
    `;
    
    const result = await executeQuery(query, [id]) as ExecuteQueryResult;
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    // main_image_url değerinin doğru döndüğünden emin ol
    const serviceData = result.rows[0];
    console.log('Servis verileri:', serviceData);
    
    // Özellikle main_image_url'yi kontrol et
    if (serviceData.main_image_url) {
      console.log('Ana görsel URL:', serviceData.main_image_url);
      
      // Image ve mainImageUrl alanlarını açıkça ayarla
      serviceData.image = serviceData.main_image_url;
      serviceData.mainImageUrl = serviceData.main_image_url;
      
      console.log('Güncellenmiş servis verileri:', {
        image: serviceData.image,
        mainImageUrl: serviceData.mainImageUrl
      });
    } else {
      console.log('Ana görsel URL bulunamadı!');
    }
    
    return NextResponse.json({
      success: true,
      item: serviceData
    });
  } catch (error) {
    console.error('Servis verisi getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Servis verisi getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Servisi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.titleTR || !body.titleEN || !body.descriptionTR || !body.descriptionEN || !body.image) {
      return NextResponse.json(
        { success: false, message: "Gerekli alanlar eksik" },
        { status: 400 }
      );
    }
    
    // Transaction başlat
    const result = await executeQuery('BEGIN') as ExecuteQueryResult;
    const client = result.client;
    
    try {
      // Servisin var olup olmadığını kontrol et
      const checkQuery = `SELECT * FROM services WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: "Güncellenecek servis bulunamadı" },
          { status: 404 }
        );
      }
      
      // Detaylar için hazırlık
      const detailsTR = Array.isArray(body.detailsTR) ? body.detailsTR : (checkResult.rows[0].details_tr || []);
      const detailsEN = Array.isArray(body.detailsEN) ? body.detailsEN : (checkResult.rows[0].details_en || []);
      
      // Servisi güncelle
      const updateQuery = `
        UPDATE services
        SET
          title_tr = $1,
          title_en = $2,
          description_tr = $3,
          description_en = $4,
          main_image_url = $5,
          order_number = $6,
          active = $7,
          details_tr = $8::text[],
          details_en = $9::text[],
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      
      const updateValues = [
        body.titleTR,
        body.titleEN,
        body.descriptionTR,
        body.descriptionEN,
        body.image,
        body.order !== undefined ? body.order : checkResult.rows[0].order_number,
        body.active !== undefined ? body.active : checkResult.rows[0].active,
        detailsTR,
        detailsEN,
        id
      ];
      
      await client.query(updateQuery, updateValues);
      
      // Eğer gallery veya images nesnesi varsa, galeriyi güncelle
      let galleryImages = [];
      
      if (Array.isArray(body.gallery) && body.gallery.length > 0) {
        galleryImages = body.gallery;
      } else if (Array.isArray(body.images) && body.images.length > 0) {
        galleryImages = body.images;
      }
      
      if (galleryImages.length > 0) {
        // Mevcut galeriyi temizle
        await client.query('DELETE FROM service_gallery WHERE service_id = $1', [id]);
        
        // Yeni galeri öğelerini ekle
        for (let i = 0; i < galleryImages.length; i++) {
          const galleryQuery = `
            INSERT INTO service_gallery (id, service_id, image_url, order_number)
            VALUES ($1, $2, $3, $4)
          `;
          
          await client.query(galleryQuery, [uuidv4(), id, galleryImages[i], i + 1]);
        }
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // Güncellenen servisi galeri bilgisiyle birlikte getir
      const getQuery = `
        SELECT 
          s.id,
          s.title_tr as "titleTR",
          s.title_en as "titleEN",
          s.description_tr as "descriptionTR",
          s.description_en as "descriptionEN",
          s.main_image_url as image,
          s.order_number as order,
          s.active,
          s.details_tr as "detailsTR",
          s.details_en as "detailsEN",
          COALESCE(
            (SELECT json_agg(sg.image_url ORDER BY sg.order_number)
             FROM service_gallery sg
             WHERE sg.service_id = s.id),
            '[]'::json
          ) as gallery
        FROM services s
        WHERE s.id = $1
      `;
      
      const finalResult = await executeQuery(getQuery, [id]) as ExecuteQueryResult;
      
      return NextResponse.json({
        success: true,
        message: "Servis başarıyla güncellendi",
        item: finalResult.rows[0]
      });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Servis güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Servis güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Servisi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Transaction başlat
    const beginResult = await executeQuery('BEGIN') as ExecuteQueryResult;
    const client = beginResult.client as DbClient;
    
    try {
      // Servisin var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM services 
        WHERE id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [id]) as { rows: any[] };
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Silinecek servis bulunamadı' },
          { status: 404 }
        );
      }
      
      // Önce servise ait galeri öğelerini sil
      await client.query('DELETE FROM service_gallery WHERE service_id = $1', [id]);
      
      // Servisi sil
      await client.query('DELETE FROM services WHERE id = $1', [id]);
      
      // Sıra numaralarını güncelle
      const reorderQuery = `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
          FROM services
        )
        UPDATE services
        SET order_number = ranked.new_order,
            updated_at = CURRENT_TIMESTAMP
        FROM ranked
        WHERE services.id = ranked.id
      `;
      
      await client.query(reorderQuery);
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      return NextResponse.json({ success: true, message: 'Servis başarıyla silindi' });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Servis silme hatası:', error);
    return NextResponse.json(
      { error: 'Servis silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 