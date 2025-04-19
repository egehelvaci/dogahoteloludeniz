import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Client arayüzü tanımlaması
interface DbClient {
  query: (query: string, params?: unknown[]) => Promise<unknown>;
  release: () => void;
}

interface ExecuteQueryResult {
  rows?: unknown[];
  rowCount?: number;
  client?: DbClient;
}

// GET - Servisin galerisini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    
    // Servisin var olup olmadığını kontrol et
    const serviceQuery = `
      SELECT * FROM services 
      WHERE id = $1
    `;
    
    const serviceResult = await executeQuery(serviceQuery, [serviceId]);
    
    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    // Servisin galerisini getir
    const galleryQuery = `
      SELECT 
        id,
        service_id as "serviceId",
        image_url as "imageUrl",
        order_number as "order",
        created_at as "createdAt"
      FROM service_gallery
      WHERE service_id = $1
      ORDER BY order_number ASC
    `;
    
    const galleryResult = await executeQuery(galleryQuery, [serviceId]);
    
    return NextResponse.json(galleryResult.rows);
  } catch (error) {
    console.error('Servis galerisi getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisi getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Servis galerisine görsel ekle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    const body = await request.json();
    
    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'Görsel URL\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Servisin var olup olmadığını kontrol et
    const serviceQuery = `
      SELECT * FROM services 
      WHERE id = $1
    `;
    
    const serviceResult = await executeQuery(serviceQuery, [serviceId]);
    
    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    // Sıra numarasını belirle
    const orderQuery = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM service_gallery
      WHERE service_id = $1
    `;
    
    const orderResult = await executeQuery(orderQuery, [serviceId]);
    const orderNumber = orderResult.rows[0].next_order;
    
    // Görseli ekle
    const insertQuery = `
      INSERT INTO service_gallery (
        id,
        service_id,
        image_url,
        order_number,
        created_at
      ) VALUES (
        $1, $2, $3, $4, CURRENT_TIMESTAMP
      ) RETURNING 
        id,
        service_id as "serviceId",
        image_url as "imageUrl",
        order_number as "order",
        created_at as "createdAt"
    `;
    
    const insertResult = await executeQuery(insertQuery, [
      uuidv4(), // Benzersiz bir UUID oluştur
      serviceId,
      body.imageUrl,
      body.order || orderNumber
    ]);
    
    return NextResponse.json(insertResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('Servis galerisine görsel eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisine görsel eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Servis galerisinden görsel sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'Silinecek görselin ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Transaction başlat
    const beginResult = await executeQuery('BEGIN') as ExecuteQueryResult;
    const client = beginResult.client as DbClient;
    
    try {
      // Görselin var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM service_gallery
        WHERE id = $1 AND service_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [imageId, serviceId]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Silinecek görsel bulunamadı' },
          { status: 404 }
        );
      }
      
      // Görseli sil
      const deleteQuery = `
        DELETE FROM service_gallery
        WHERE id = $1
      `;
      
      await client.query(deleteQuery, [imageId]);
      
      // Sıra numaralarını güncelle
      const reorderQuery = `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
          FROM service_gallery
          WHERE service_id = $1
        )
        UPDATE service_gallery
        SET order_number = ranked.new_order
        FROM ranked
        WHERE service_gallery.id = ranked.id
      `;
      
      await client.query(reorderQuery, [serviceId]);
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      return NextResponse.json({ success: true });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Servis galerisinden görsel silinirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisinden görsel silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Servis galerisini güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Client'ı burada tanımlayalım ki her durumda release edilebilsin
  let client = null;

  try {
    // Next.js 15'te parametreler Promise olarak geliyor, önce çözümlememiz gerekiyor
    const resolvedParams = await params;
    const serviceId = resolvedParams.id;
    console.log("İşlenecek servis ID:", serviceId);
    
    let body;
    try {
      body = await request.json();
      console.log("İstek gövdesi alındı ve işleniyor");
      
      console.log('Servis galeri güncelleme isteği:', { 
        serviceId, 
        resimSayisi: body.images?.length || 0 
      });
    } catch (err) {
      console.error('İstek gövdesi alınamadı:', err);
      return NextResponse.json(
        { error: 'İstek gövdesi alınamadı', success: false },
        { status: 400 }
      );
    }
    
    // İstek validasyonu
    if (!body) {
      return NextResponse.json(
        { error: 'Boş istek gövdesi', success: false },
        { status: 400 }
      );
    }
    
    if (!body.images) {
      return NextResponse.json(
        { error: 'Görsel listesi gereklidir', success: false },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.images)) {
      return NextResponse.json(
        { error: 'Görsel listesi bir dizi olmalıdır', success: false },
        { status: 400 }
      );
    }
    
    // Görsel listesini filtrele - boş string, null, undefined değerleri temizle
    const validImages = body.images
      .filter(url => url && typeof url === 'string' && url.trim() !== '')
      .map(url => url.trim());
    
    console.log(`Filtreden sonra ${validImages.length} adet geçerli görsel URL'si kaldı`);
    
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir görsel bulunamadı', success: false },
        { status: 400 }
      );
    }
    
    // Ana görsel seçenekleri
    const mainImage = body.image || validImages[0];
    console.log("Seçilen ana görsel var");
    
    // Veritabanı kontrolleri
    try {
      // Gelen ID'yi temizle (olası boşluk veya özel karakterleri kaldır)
      const cleanServiceId = serviceId.trim();
      console.log("Temizlenmiş servis ID:", cleanServiceId);
      
      // Servisi kontrol et
      console.log("Servis arama sorgusu yapılıyor...");
      console.log("SQL sorgusu: SELECT * FROM services WHERE id = $1");
      console.log("Parametre:", cleanServiceId);
      
      // Sorguyu executeQuery ile çalıştır
      const serviceCheck = await executeQuery(
        "SELECT * FROM services WHERE id = $1", 
        [cleanServiceId]
      );
      
      // Sonucu önce string olarak alalım
      const serviceResultString = JSON.stringify(serviceCheck);
      console.log("Servis sorgu ham sonucu:", serviceResultString);
      
      // Sonucu JSON olarak çözümleyelim - bu daha güvenilir sonuç verecek
      let serviceData = [];
      
      try {
        // Eğer direkt bir dizi döndüyse
        if (Array.isArray(serviceCheck)) {
          serviceData = serviceCheck;
          console.log("Direkt dizi sonucu alındı, uzunluk:", serviceData.length);
        } 
        // Ya da bir dizi içeren bir nesne döndüyse
        else if (serviceCheck && Array.isArray(serviceCheck.rows)) {
          serviceData = serviceCheck.rows;
          console.log("rows dizisi sonucu alındı, uzunluk:", serviceData.length);
        }
        // Eğer string bir JSON sonucu geldiyse
        else if (serviceResultString && serviceResultString.startsWith('[') && serviceResultString.includes('"id"')) {
          // String JSON olarak döndüyse parse et
          try {
            const parsedData = JSON.parse(serviceResultString);
            if (Array.isArray(parsedData)) {
              serviceData = parsedData;
            }
            console.log("JSON parse edildi, uzunluk:", serviceData.length);
          } catch (parseErr) {
            console.error("JSON parse hatası:", parseErr);
          }
        }
      } catch (e) {
        console.error("Veri yapısı işleme hatası:", e);
      }
      
      console.log("Son veri yapısı:", typeof serviceData, "uzunluk:", serviceData.length);
      
      // Servis bulunamadı mı?
      if (!serviceData || serviceData.length === 0) {
        console.log("Servis bulunamadı, tüm servisleri listeliyorum...");
        
        // Tüm servisleri listele (DEBUG amaçlı)
        const allServices = await executeQuery("SELECT id, title_tr FROM services LIMIT 10");
        let allServicesList = [];
        
        if (Array.isArray(allServices)) {
          allServicesList = allServices;
        } else if (allServices && Array.isArray(allServices.rows)) {
          allServicesList = allServices.rows;
        }
        
        console.log("Sistemdeki servisler:", JSON.stringify(allServicesList));
        
        return NextResponse.json(
          { error: 'Servis bulunamadı', success: false },
          { status: 404 }
        );
      }
      
      // Servis bulundu!
      const foundService = serviceData[0];
      console.log("Servis bulundu:", JSON.stringify(foundService));
      
      // Direkt sorguları çalıştır - TRANSACTION OLMADAN
      console.log("İşlemlere başlanıyor (transaction kullanılmıyor)...");

      try {
        // 1. Önce ana görseli güncelle (services tablosunda main_image_url)
        const mainImageToUpdate = validImages[0];
        console.log(`Ana görsel güncelleniyor: ${mainImageToUpdate.substr(0, 30)}...`);
        
        // Ana görseli update et
        const updateSQL = `
          UPDATE services
          SET main_image_url = $1, 
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, main_image_url
        `;
        
        const updateResult = await executeQuery(updateSQL, [mainImageToUpdate, cleanServiceId]);
        console.log("Ana görsel güncelleme sonucu:", updateResult.rows);
        
        // 2. Eski galeri görsellerini temizle
        console.log("Eski galeri kayıtları temizleniyor...");
        const deleteSQL = `DELETE FROM service_gallery WHERE service_id = $1`;
        const deleteResult = await executeQuery(deleteSQL, [cleanServiceId]);
        console.log("Silinen kayıt sayısı:", deleteResult.rowCount);
        
        // 3. Yeni galeri görsellerini ekle
        console.log("Yeni görseller ekleniyor...");
        let insertedCount = 0;
        
        for (let i = 0; i < validImages.length; i++) {
          const imageUrl = validImages[i];
          const orderNumber = i + 1;
          const id = uuidv4();
          
          const insertSQL = `
            INSERT INTO service_gallery 
              (id, service_id, image_url, order_number, created_at)
            VALUES 
              ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `;
          
          await executeQuery(insertSQL, [id, cleanServiceId, imageUrl, orderNumber]);
          insertedCount++;
          console.log(`Görsel #${orderNumber} eklendi`);
        }
        
        // İşlem sonucu
        console.log("Tüm işlemler başarıyla tamamlandı!");
        console.log(`Güncellenen ana görsel: ${mainImageToUpdate.substr(0, 30)}...`);
        console.log(`Eklenen görsel sayısı: ${insertedCount}`);
        
        return NextResponse.json({
          success: true,
          message: 'Servis galerisi başarıyla güncellendi',
          imageCount: validImages.length,
          mainImage: mainImageToUpdate,
          serviceId: cleanServiceId
        });
      } catch (err) {
        console.error("Veritabanı işlemi hatası:", err);
        
        let errorMessage = 'Bilinmeyen bir hata oluştu';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        return NextResponse.json({
          success: false,
          error: 'Veritabanı güncellenirken bir hata oluştu',
          detail: errorMessage
        }, { status: 500 });
      }
    } catch (dbError) {
      console.error("Veritabanı hatası:", dbError);
      
      // Hata mesajını düzenle
      let errorDetail = 'Veritabanı işlemi sırasında bir hata oluştu';
      if (dbError.message) {
        errorDetail = dbError.message;
      }
      
      if (dbError.code) {
        errorDetail += ` (Hata kodu: ${dbError.code})`;
      }
      
      return NextResponse.json(
        { 
          error: 'Veritabanı güncellenirken bir hata oluştu', 
          detail: errorDetail,
          success: false 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Genel hata:", error);
    
    return NextResponse.json(
      { 
        error: 'Beklenmeyen bir hata oluştu',
        detail: error instanceof Error ? error.message : String(error),
        success: false 
      },
      { status: 500 }
    );
  }
}
