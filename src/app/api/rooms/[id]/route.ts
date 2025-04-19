import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { notifyRoomsUpdated } from '../../websocket/route';
import { randomUUID } from 'crypto';

// Tüm API isteklerini dinamik olarak yap
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Belirli bir odayı ID'ye göre getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('[API] Oda detay çağrısı:', params.id);
  
  try {
    // ID'yi al
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz oda ID\'si' },
        { status: 400 }
      );
    }

    // Önce tüm aktif odaları getir
    const allRoomsQuery = `SELECT id, name_tr, active FROM rooms WHERE active = true ORDER BY order_number`;
    const allRoomsResult = await executeQuery(allRoomsQuery);
    const availableRooms = allRoomsResult.rows.map((room: any) => ({
      id: room.id,
      name: room.name_tr
    }));
    
    console.log('[API] Mevcut odalar:', JSON.stringify(availableRooms));
    
    // Verilen ID ile oda detayını getir
    const query = `
      SELECT 
        r.id, 
        r.name_tr as "nameTR", 
        r.name_en as "nameEN", 
        r.description_tr as "descriptionTR", 
        r.description_en as "descriptionEN", 
        r.main_image_url as image, 
        r.price_tr as "priceTR", 
        r.price_en as "priceEN", 
        r.capacity, 
        r.size, 
        r.features_tr as "featuresTR", 
        r.features_en as "featuresEN", 
        r.type,
        r.active,
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
    
    if (result.rows.length === 0) {
      console.log(`[API] Oda bulunamadı: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Oda bulunamadı',
          requestedId: id,
          availableRooms
        },
        { status: 404 }
      );
    }
    
    // API yanıtı için önbellekleme önleyici başlıklar ekle
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    console.log('[API] Oda başarıyla bulundu:', result.rows[0].id);
    
    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { headers }
    );
  } catch (error) {
    console.error('[API] Oda bilgisi alınırken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Oda bilgisi alınamadı', 
        error: String(error)
      },
      { status: 500 }
    );
  }
}

// PUT - Odayı güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    console.log('API PUT - Gelen veri:', JSON.stringify(body, null, 2));
    
    // Odanın var olup olmadığını kontrol et
    const checkQuery = `
      SELECT * FROM rooms 
      WHERE id = $1
    `;
    
    const checkResult = await executeQuery(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Güncellenecek oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Transaction başlat
    const client = await (await executeQuery('BEGIN')).client;
    
    try {
      // Güncellenecek alanları belirle
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      if (body.nameTR !== undefined) {
        updateFields.push(`name_tr = $${paramCounter++}`);
        updateValues.push(body.nameTR);
      }
      
      if (body.nameEN !== undefined) {
        updateFields.push(`name_en = $${paramCounter++}`);
        updateValues.push(body.nameEN);
      }
      
      if (body.descriptionTR !== undefined) {
        updateFields.push(`description_tr = $${paramCounter++}`);
        updateValues.push(body.descriptionTR);
      }
      
      if (body.descriptionEN !== undefined) {
        updateFields.push(`description_en = $${paramCounter++}`);
        updateValues.push(body.descriptionEN);
      }
      
      // Görsel alanı kontrolü - hem image hem mainImageUrl destekle
      if (body.image !== undefined) {
        updateFields.push(`main_image_url = $${paramCounter++}`);
        updateValues.push(body.image);
      } else if (body.mainImageUrl !== undefined) {
        updateFields.push(`main_image_url = $${paramCounter++}`);
        updateValues.push(body.mainImageUrl);
      }
      
      if (body.priceTR !== undefined) {
        updateFields.push(`price_tr = $${paramCounter++}`);
        updateValues.push(body.priceTR);
      }
      
      if (body.priceEN !== undefined) {
        updateFields.push(`price_en = $${paramCounter++}`);
        updateValues.push(body.priceEN);
      }
      
      if (body.capacity !== undefined) {
        updateFields.push(`capacity = $${paramCounter++}`);
        updateValues.push(body.capacity);
      }
      
      if (body.size !== undefined) {
        updateFields.push(`size = $${paramCounter++}`);
        updateValues.push(body.size);
      }
      
      if (body.featuresTR !== undefined) {
        updateFields.push(`features_tr = $${paramCounter++}`);
        // Doğrudan dizi olarak gönder - node-postgres bu diziyi text[] olarak işleyecek
        updateValues.push(body.featuresTR);
      }
      
      if (body.featuresEN !== undefined) {
        updateFields.push(`features_en = $${paramCounter++}`);
        // Doğrudan dizi olarak gönder - node-postgres bu diziyi text[] olarak işleyecek 
        updateValues.push(body.featuresEN);
      }
      
      if (body.type !== undefined) {
        updateFields.push(`type = $${paramCounter++}`);
        updateValues.push(body.type);
      }
      
      if (body.roomTypeId !== undefined) {
        updateFields.push(`room_type_id = $${paramCounter++}`);
        updateValues.push(body.roomTypeId);
      }
      
      if (body.active !== undefined) {
        updateFields.push(`active = $${paramCounter++}`);
        updateValues.push(body.active);
      }
      
      // Sıra numarası kontrolü - hem order hem orderNumber destekle
      if (body.order !== undefined) {
        updateFields.push(`order_number = $${paramCounter++}`);
        updateValues.push(body.order);
      } else if (body.orderNumber !== undefined) {
        updateFields.push(`order_number = $${paramCounter++}`);
        updateValues.push(body.orderNumber);
      }
      
      console.log('Güncellenecek alanlar:', updateFields);
      console.log('Güncellenecek değerler:', updateValues);
      
      // En az bir alan güncellenmeli
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        // ID'yi en son parametre olarak ekle
        updateValues.push(id);
        
        const updateQuery = `
          UPDATE rooms
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING *
        `;
        
        console.log('SQL Sorgusu:', updateQuery);
        
        const updateResult = await client.query(updateQuery, updateValues);
        console.log('Güncelleme sonucu:', updateResult.rows[0]);
      }
      
      // Galeri görsellerini güncelle (eğer gönderilmişse)
      if (Array.isArray(body.gallery)) {
        // Mevcut galeri öğelerini sil
        await client.query('DELETE FROM room_gallery WHERE room_id = $1', [id]);
        
        // Yeni galeri öğelerini ekle
        for (let i = 0; i < body.gallery.length; i++) {
          // UUID oluştur - NOT NULL constraint için
          const galleryItemId = randomUUID();
          
          const galleryQuery = `
            INSERT INTO room_gallery (id, room_id, image_url, order_number)
            VALUES ($1, $2, $3, $4)
          `;
          
          await client.query(galleryQuery, [galleryItemId, id, body.gallery[i], i + 1]);
        }
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyRoomsUpdated();
      
      // Güncellenmiş odayı getir
      const getQuery = `
        SELECT 
          r.id, 
          r.name_tr as "nameTR", 
          r.name_en as "nameEN", 
          r.description_tr as "descriptionTR", 
          r.description_en as "descriptionEN", 
          r.main_image_url as image, 
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
          COALESCE(
            (SELECT json_agg(image_url ORDER BY order_number ASC)
             FROM room_gallery
             WHERE room_id = r.id), 
            '[]'::json
          ) as gallery
        FROM rooms r
        WHERE r.id = $1
      `;
      
      const finalResult = await executeQuery(getQuery, [id]);
      
      return NextResponse.json({
        success: true,
        data: finalResult.rows[0],
        message: 'Oda başarıyla güncellendi'
      });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      console.error('SQL Hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Oda güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: `Oda güncellenirken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE - Odayı sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Transaction başlat
    const client = await (await executeQuery('BEGIN')).client;
    
    try {
      // Odanın var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM rooms 
        WHERE id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
      return NextResponse.json(
          { success: false, message: 'Silinecek oda bulunamadı' },
        { status: 404 }
      );
    }
      
      // Önce odaya ait galeri öğelerini sil
      await client.query('DELETE FROM room_gallery WHERE room_id = $1', [id]);
    
    // Odayı sil
      await client.query('DELETE FROM rooms WHERE id = $1', [id]);
      
      // Sıra numaralarını güncelle
      const reorderQuery = `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
          FROM rooms
        )
        UPDATE rooms
        SET order_number = ranked.new_order,
            updated_at = CURRENT_TIMESTAMP
        FROM ranked
        WHERE rooms.id = ranked.id
      `;
      
      await client.query(reorderQuery);
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyRoomsUpdated();
      
      return NextResponse.json({
        success: true,
        message: 'Oda başarıyla silindi'
      });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Oda silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
