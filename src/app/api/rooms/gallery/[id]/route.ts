import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { notifyRoomsUpdated, notifyGalleryUpdated } from '../../../websocket/route';
import { randomUUID } from 'crypto';  // UUID üreteci import ediyoruz

// Define a basic interface for Room items based on usage
interface RoomItem {
  id: string;
  image: string;
  gallery: string[];
  // Add other properties if needed based on roomsData.json structure
}

// GET - Odanın galeri görsellerini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Odayı veritabanından getir
    const roomQuery = `
      SELECT * FROM rooms 
      WHERE id = $1
    `;
    
    const roomResult = await executeQuery(roomQuery, [id]);
    
    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Odanın galerisini getir
    const galleryQuery = `
      SELECT * FROM room_gallery
      WHERE room_id = $1
      ORDER BY order_number ASC
    `;
    
    const galleryResult = await executeQuery(galleryQuery, [id]);
    
    return NextResponse.json({
      success: true,
      data: {
        mainImage: roomResult.rows[0].main_image_url,
        gallery: galleryResult.rows.map(item => item.image_url)
      }
    });
  } catch (error) {
    console.error('Galeri verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri verisi alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Odanın galeri görsellerini güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    console.log('Gelen galeri verileri:', JSON.stringify(body, null, 2));
    
    // Kontrol - formatlı galeri veya normal galeri array'i
    let galleryUrls: string[] = [];
    const { mainImageUrl } = body;
    
    // Formatlı galeri kontrolü ({ id, imageUrl } nesneleri)
    if (body.gallery && Array.isArray(body.gallery) && body.gallery.length > 0) {
      if (typeof body.gallery[0] === 'object' && body.gallery[0].imageUrl) {
        // Formatlı galeri - imageUrl'leri al
        galleryUrls = body.gallery.map((item: { imageUrl: string }) => item.imageUrl);
        console.log('Formatlı galeriden URL listesi oluşturuldu:', galleryUrls.length);
      } else {
        // Normal string dizisi
        galleryUrls = body.gallery;
        console.log('Normal string dizisi kullanıldı:', galleryUrls.length);
      }
    }

    // Odayı veritabanından getir
    const roomQuery = `
      SELECT * FROM rooms 
      WHERE id = $1
    `;
    
    const roomResult = await executeQuery(roomQuery, [id]);
    
    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Galerinin dizi olduğundan emin ol
    if (!Array.isArray(galleryUrls)) {
      return NextResponse.json(
        { success: false, message: 'Galeri bir dizi olmalıdır' },
        { status: 400 }
      );
    }
    
    // İşlemler için transaction başlat
    const client = await (await executeQuery('BEGIN')).client;
    
    try {
      // Ana görseli güncelle
      if (mainImageUrl) {
        const updateRoomQuery = `
          UPDATE rooms 
          SET main_image_url = $1
          WHERE id = $2
        `;
        
        await client.query(updateRoomQuery, [mainImageUrl, id]);
      }
      
      // Mevcut galeri öğelerini sil
      const deleteGalleryQuery = `
        DELETE FROM room_gallery
        WHERE room_id = $1
      `;
      
      await client.query(deleteGalleryQuery, [id]);
      
      // Yeni galeri öğelerini ekle
      for (let i = 0; i < galleryUrls.length; i++) {
        const galleryItemId = randomUUID(); // Her galeri öğesi için benzersiz UUID
        
        const insertGalleryQuery = `
          INSERT INTO room_gallery (id, room_id, image_url, order_number)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(insertGalleryQuery, [galleryItemId, id, galleryUrls[i], i + 1]);
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyRoomsUpdated();
      notifyGalleryUpdated();
      
      // Güncellenmiş galeriyi getir
      const updatedQuery = `
        SELECT * FROM room_gallery
        WHERE room_id = $1
        ORDER BY order_number ASC
      `;
      
      const updatedGallery = await executeQuery(updatedQuery, [id]);
      const updatedRoom = await executeQuery('SELECT * FROM rooms WHERE id = $1', [id]);
      
      return NextResponse.json({
        success: true,
        data: {
          mainImage: updatedRoom.rows[0].main_image_url,
          gallery: updatedGallery.rows.map(item => item.image_url)
        },
        message: 'Galeri başarıyla güncellendi'
      });
    } catch (error) {
      // Hata durumunda rollback yap
      await client.query('ROLLBACK');
      console.error('Transaction hatası:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Galeriye görsel ekle
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { imagePath } = body;
    
    if (!imagePath) {
      return NextResponse.json(
        { success: false, message: 'Görsel yolu gereklidir' },
        { status: 400 }
      );
    }

    // Odanın var olup olmadığını kontrol et
    const roomQuery = `
      SELECT * FROM rooms 
      WHERE id = $1
    `;
    
    const roomResult = await executeQuery(roomQuery, [id]);
    
    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Görsel zaten galeriye eklenmiş mi kontrol et
    const checkQuery = `
      SELECT * FROM room_gallery
      WHERE room_id = $1 AND image_url = $2
    `;
    
    const checkResult = await executeQuery(checkQuery, [id, imagePath]);
    
    if (checkResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Bu görsel zaten galeride mevcut'
      });
    }
    
    // Toplam galeri öğesi sayısını bul
    const countQuery = `
      SELECT COUNT(*) as count FROM room_gallery
      WHERE room_id = $1
    `;
    
    const countResult = await executeQuery(countQuery, [id]);
    const orderNumber = parseInt(countResult.rows[0].count) + 1;
    
    // Görseli galeriye ekle - UUID ile
    const galleryItemId = randomUUID(); // Benzersiz UUID
    
    const insertQuery = `
      INSERT INTO room_gallery (id, room_id, image_url, order_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const insertResult = await executeQuery(insertQuery, [
      galleryItemId, 
      id, 
      imagePath, 
      orderNumber
    ]);
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      data: insertResult.rows[0],
      message: 'Görsel galeriye eklendi'
    });
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görsel eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Galeriden görsel çıkar
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const url = new URL(request.url);
    const imagePath = url.searchParams.get('imagePath');
    
    if (!imagePath) {
      return NextResponse.json(
        { success: false, message: 'Görsel yolu gereklidir' },
        { status: 400 }
      );
    }
    
    // Odanın var olup olmadığını kontrol et
    const roomQuery = `
      SELECT * FROM rooms 
      WHERE id = $1
    `;
    
    const roomResult = await executeQuery(roomQuery, [id]);
    
    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Görseli sil
    const deleteQuery = `
      DELETE FROM room_gallery
      WHERE room_id = $1 AND image_url = $2
      RETURNING *
    `;
    
    const deleteResult = await executeQuery(deleteQuery, [id, imagePath]);
    
    if (deleteResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Görsel bulunamadı'
      });
    }
    
    // Kalan görsellerin sıra numaralarını yeniden düzenle
    const reorderQuery = `
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
        FROM room_gallery
        WHERE room_id = $1
      )
      UPDATE room_gallery g
      SET order_number = n.new_order
      FROM numbered n
      WHERE g.id = n.id AND g.room_id = $1
    `;
    
    await executeQuery(reorderQuery, [id]);
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      message: 'Görsel galeriden kaldırıldı'
    });
  } catch (error) {
    console.error('Görsel silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görsel kaldırılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
