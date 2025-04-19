import { NextResponse } from 'next/server';
import { executeQuery, beginTransaction } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Veritabanı sorgu sonucu tipi
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  client?: DbClient;
}

// Veritabanı istemci tipi
interface DbClient {
  query: (query: string, params?: unknown[]) => Promise<any>;
  release: () => void;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

// Slider veri tipi
export interface SliderItem {
  id: string;
  titleTR: string;
  titleEN: string;
  subtitleTR?: string;
  subtitleEN?: string;
  descriptionTR?: string;
  descriptionEN?: string;
  image?: string;
  videoUrl?: string;
  order: number;
  active: boolean;
}

// GET - Tüm slider öğelerini getir
export async function GET() {
  try {
    console.log('GET /api/hero-slider/ isteği alındı');
    
    const query = `
      SELECT 
        id,
        title_tr as "titleTR",
        title_en as "titleEN",
        subtitle_tr as "subtitleTR",
        subtitle_en as "subtitleEN",
        description_tr as "descriptionTR", 
        description_en as "descriptionEN",
        image_url as "image",
        video_url as "videoUrl",
        order_number as "order",
        active
      FROM slider
      ORDER BY order_number
    `;
    
    console.log('SQL Sorgusu:', query);
    
    const result = await executeQuery(query) as any;
    console.log(`${result.rows.length} slider öğesi bulundu`);
    
    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Slider verileri çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Slider verileri alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni slider öğesi ekle
export async function POST(request: Request) {
  let client = null;
  
  try {
    const body = await request.json();
    console.log('POST /api/hero-slider/ isteği alındı:', body);
    
    // Zorunlu alanları kontrol et
    if (!body.titleTR || !body.titleEN) {
      return NextResponse.json(
        { success: false, message: 'Başlık alanları zorunludur' },
        { status: 400 }
      );
    }

    // En az bir görsel veya video olmalı
    if (!body.image && !body.videoUrl) {
      return NextResponse.json(
        { success: false, message: 'En az bir görsel veya video gereklidir' },
        { status: 400 }
      );
    }

    // Yeni slider öğesi için ID oluştur
    const id = uuidv4();
    
    try {
      // Son sıra numarasını bul
      const maxOrderQuery = `
        SELECT COALESCE(MAX(order_number), 0) as max_order
        FROM slider
      `;
      
      const maxOrderResult = await executeQuery(maxOrderQuery) as any;
      const nextOrder = maxOrderResult.rows[0].max_order + 1;
      
      console.log('Transaction başlatılıyor...');
      
      // Transaction başlat - geliştirilmiş yöntem
      const beginResult = await beginTransaction();
      client = beginResult.client;
      
      // Client kontrolü
      if (!client) {
        console.error('Veritabanı client alınamadı');
        throw new Error('Veritabanı transaction başlatılamadı');
      }
      
      console.log('Transaction başlatıldı, client hazır');
      
      // Yeni slider öğesi ekle
      const insertQuery = `
        INSERT INTO slider (
          id,
          title_tr,
          title_en,
          subtitle_tr,
          subtitle_en,
          description_tr,
          description_en,
          image_url,
          video_url,
          order_number,
          active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const insertValues = [
        id,
        body.titleTR,
        body.titleEN,
        body.subtitleTR || null,
        body.subtitleEN || null,
        body.descriptionTR || null,
        body.descriptionEN || null,
        body.image || null, 
        body.videoUrl || null,
        nextOrder,
        body.active !== undefined ? body.active : true
      ];
      
      console.log('Ekleme sorgusu çalıştırılıyor...');
      console.log('Değerler:', insertValues);
      
      try {
        const insertResult = await client.query(insertQuery, insertValues);
        
        if (!insertResult.rows || insertResult.rows.length === 0) {
          throw new Error('Veritabanına ekleme başarısız oldu');
        }
        
        console.log('Insert başarılı, transaction tamamlanıyor...');
        
        // Transaction'ı tamamla
        await client.commit();
        
        console.log('Transaction tamamlandı');
        
        // API yanıtını düzenle - özellik adlarını düzelt
        const createdSlider = {
          id: insertResult.rows[0].id,
          titleTR: insertResult.rows[0].title_tr,
          titleEN: insertResult.rows[0].title_en,
          subtitleTR: insertResult.rows[0].subtitle_tr,
          subtitleEN: insertResult.rows[0].subtitle_en,
          descriptionTR: insertResult.rows[0].description_tr,
          descriptionEN: insertResult.rows[0].description_en,
          image: insertResult.rows[0].image_url,
          videoUrl: insertResult.rows[0].video_url,
          order: insertResult.rows[0].order_number,
          active: insertResult.rows[0].active
        };
        
        console.log('Slider başarıyla eklendi:', createdSlider);
        
        return NextResponse.json({
          success: true,
          data: createdSlider,
          message: 'Slider öğesi başarıyla eklendi'
        });
      } catch (queryError) {
        // Sorgu hatası durumunda rollback yap
        console.error('Sorgu hatası, rollback yapılıyor:', queryError);
        await client.rollback();
        throw queryError; // Hatayı üst bloğa ilet
      }
    } catch (dbError) {
      console.error('Veritabanı işlemi hatası:', dbError);
      // Client varsa ve hata olduysa rollback yapmayı dene
      if (client) {
        try {
          await client.rollback();
        } catch (rollbackError) {
          console.error('Rollback hatası:', rollbackError);
        }
      }
      throw new Error(`Veritabanı işlemi hatası: ${dbError.message || 'Bilinmeyen hata'}`);
    }
  } catch (error) {
    console.error('Slider ekleme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Slider eklenirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// PUT - Slider öğesini güncelle
export async function PUT(request: Request) {
  let client = null;
  
  try {
    const body = await request.json();
    console.log('PUT /api/hero-slider/ isteği alındı:', body);
    
    // ID kontrolü
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Slider ID\'si belirtilmedi' },
        { status: 400 }
      );
    }

    try {
      // Slider varlığını kontrol et
      const checkQuery = `
        SELECT * FROM slider 
        WHERE id = $1
      `;
      
      console.log('Slider kontrolü yapılıyor, ID:', body.id);
      const checkResult = await executeQuery(checkQuery, [body.id]) as any;
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        console.log('Slider bulunamadı, ID:', body.id);
        return NextResponse.json(
          { success: false, message: 'Slider öğesi bulunamadı' },
          { status: 404 }
        );
      }

      console.log('Slider bulundu, transaction başlatılıyor...');
      
      // Transaction başlat
      const beginResult = await executeQuery('BEGIN') as any;
      client = beginResult.client as DbClient;
      
      if (!client) {
        console.error('Veritabanı client alınamadı');
        throw new Error('Veritabanı transaction başlatılamadı');
      }
      
      console.log('Transaction başlatıldı, client hazır');
      
      try {
        // Slider öğesini güncelle
        const updateQuery = `
          UPDATE slider SET
            title_tr = $1,
            title_en = $2,
            subtitle_tr = $3,
            subtitle_en = $4,
            description_tr = $5,
            description_en = $6,
            image_url = $7,
            video_url = $8,
            order_number = $9,
            active = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $11
          RETURNING *
        `;
        
        const updateValues = [
          body.titleTR !== undefined ? body.titleTR : checkResult.rows[0].title_tr,
          body.titleEN !== undefined ? body.titleEN : checkResult.rows[0].title_en,
          body.subtitleTR !== undefined ? body.subtitleTR : checkResult.rows[0].subtitle_tr,
          body.subtitleEN !== undefined ? body.subtitleEN : checkResult.rows[0].subtitle_en,
          body.descriptionTR !== undefined ? body.descriptionTR : checkResult.rows[0].description_tr,
          body.descriptionEN !== undefined ? body.descriptionEN : checkResult.rows[0].description_en,
          body.image !== undefined ? body.image : checkResult.rows[0].image_url,
          body.videoUrl !== undefined ? body.videoUrl : checkResult.rows[0].video_url,
          body.order !== undefined ? body.order : checkResult.rows[0].order_number,
          body.active !== undefined ? body.active : checkResult.rows[0].active,
          body.id
        ];
        
        console.log('Güncelleme sorgusu çalıştırılıyor...');
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (!updateResult.rows || updateResult.rows.length === 0) {
          throw new Error('Güncelleme başarısız oldu');
        }
        
        console.log('Güncelleme başarılı, transaction tamamlanıyor...');
        
        // Transaction'ı tamamla
        await client.commit();
        
        console.log('Transaction tamamlandı');
        
        // API yanıtını düzenle
        const updatedSlider = {
          id: updateResult.rows[0].id,
          titleTR: updateResult.rows[0].title_tr,
          titleEN: updateResult.rows[0].title_en,
          subtitleTR: updateResult.rows[0].subtitle_tr,
          subtitleEN: updateResult.rows[0].subtitle_en,
          descriptionTR: updateResult.rows[0].description_tr,
          descriptionEN: updateResult.rows[0].description_en,
          image: updateResult.rows[0].image_url,
          videoUrl: updateResult.rows[0].video_url,
          order: updateResult.rows[0].order_number,
          active: updateResult.rows[0].active
        };
        
        console.log('Slider başarıyla güncellendi:', updatedSlider);
        
        return NextResponse.json({
          success: true,
          data: updatedSlider,
          message: 'Slider öğesi başarıyla güncellendi'
        });
      } catch (queryError) {
        // Sorgu hatası durumunda rollback yap
        console.error('Sorgu hatası, rollback yapılıyor:', queryError);
        await client.rollback();
        throw queryError; // Hatayı üst bloğa ilet
      }
    } catch (dbError) {
      console.error('Veritabanı işlemi hatası:', dbError);
      
      // Client varsa ve hata olduysa rollback yapmayı dene
      if (client) {
        try {
          await client.rollback();
        } catch (rollbackError) {
          console.error('Rollback hatası:', rollbackError);
        }
      }
      
      throw new Error(`Veritabanı işlemi hatası: ${dbError.message || 'Bilinmeyen hata'}`);
    }
  } catch (error) {
    console.error('Slider güncelleme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Slider güncellenirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}

// DELETE - Slider öğesini sil
export async function DELETE(request: Request) {
  let client = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('DELETE /api/hero-slider/ isteği alındı, ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Slider ID\'si belirtilmedi' },
        { status: 400 }
      );
    }

    try {
      // Slider varlığını kontrol et
      const checkQuery = `
        SELECT * FROM slider 
        WHERE id = $1
      `;
      
      console.log('Slider kontrolü yapılıyor, ID:', id);
      const checkResult = await executeQuery(checkQuery, [id]) as any;
      
      if (!checkResult.rows || checkResult.rows.length === 0) {
        console.log('Slider bulunamadı, ID:', id);
        return NextResponse.json(
          { success: false, message: 'Slider öğesi bulunamadı' },
          { status: 404 }
        );
      }
      
      console.log('Slider bulundu, transaction başlatılıyor...');

      // Transaction başlat
      const beginResult = await executeQuery('BEGIN') as any;
      client = beginResult.client as DbClient;
      
      if (!client) {
        console.error('Veritabanı client alınamadı');
        throw new Error('Veritabanı transaction başlatılamadı');
      }
      
      console.log('Transaction başlatıldı, client hazır');
      
      // Silinecek slider bilgilerini saklayın (yanıt için)
      const sliderToDelete = {
        id: checkResult.rows[0].id,
        titleTR: checkResult.rows[0].title_tr,
        titleEN: checkResult.rows[0].title_en,
        image: checkResult.rows[0].image_url
      };
      
      try {
        // Slider öğesini sil
        const deleteQuery = `
          DELETE FROM slider 
          WHERE id = $1
          RETURNING id
        `;
        
        console.log('Silme sorgusu çalıştırılıyor...');
        const deleteResult = await client.query(deleteQuery, [id]);
        
        if (!deleteResult.rows || deleteResult.rows.length === 0) {
          throw new Error('Silme işlemi başarısız oldu');
        }
        
        console.log('Silme başarılı, sıralama yeniden düzenleniyor...');
        
        // Sıralama numaralarını yeniden düzenle
        const reorderQuery = `
          WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
            FROM slider
          )
          UPDATE slider
          SET order_number = ranked.new_order
          FROM ranked
          WHERE slider.id = ranked.id
        `;
        
        await client.query(reorderQuery);
        console.log('Sıralama yeniden düzenlendi, transaction tamamlanıyor...');
        
        // Transaction'ı tamamla
        await client.commit();
        console.log('Transaction tamamlandı');
        
        return NextResponse.json({
          success: true,
          data: sliderToDelete,
          message: 'Slider öğesi başarıyla silindi'
        });
      } catch (queryError) {
        // Sorgu hatası durumunda rollback yap
        console.error('Sorgu hatası, rollback yapılıyor:', queryError);
        await client.rollback();
        throw queryError; // Hatayı üst bloğa ilet
      }
    } catch (dbError) {
      console.error('Veritabanı işlemi hatası:', dbError);
      
      // Client varsa ve hata olduysa rollback yapmayı dene
      if (client) {
        try {
          await client.rollback();
        } catch (rollbackError) {
          console.error('Rollback hatası:', rollbackError);
        }
      }
      
      throw new Error(`Veritabanı işlemi hatası: ${dbError.message || 'Bilinmeyen hata'}`);
    }
  } catch (error) {
    console.error('Slider silme hatası:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Slider silinirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}