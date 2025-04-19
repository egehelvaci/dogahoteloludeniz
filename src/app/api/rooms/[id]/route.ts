import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notifyRoomsUpdated } from '../../websocket/route';
import { generateUUID } from '../../../../lib/utils';
import { connection } from '@/lib/db';
import { executeQuery } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Prisma istemcisi oluştur
const prisma = new PrismaClient();

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
    // Next.js 15 uyumluluğu için connection çağrısı
    await connection();

    // URL'den dil parametresini al
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'tr';
    
    // ID'yi al ve doğrula
    const id = params.id;
    
    // Geçersiz ID kontrolü
    if (!id) {
      console.error('[API:rooms/[id]] Geçersiz boş ID');
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
      console.error(`[API:rooms/[id]] Statik dosya uzantılı ID algılandı: ${id}`);
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
    
    console.log(`[API:rooms/[id]] Oda ID'si ile sorgu yapılıyor: ${id}, dil: ${lang}`);

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
      console.log(`[API:rooms/[id]] Oda bulunamadı: ${id}`);
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
    console.log(`[API:rooms/[id]] Oda bulundu: ${room.id}`);
    
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
    console.error('[API:rooms/[id]] Oda sorgulama hatası:', error);
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

// PUT - Odayı güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Next.js 15 uyumluluğu için connection() çağırarak dinamik içerik işlemini başlat
  await connection();
  
  // Next.js 15 uyumluluğu için params'ı await etmeliyiz
  const resolvedParams = await params;
  
  // Params değerlerini güvenli bir şekilde kullan
  const id = resolvedParams.id;
  
  try {
    const body = await request.json();
    
    console.log('API PUT - Gelen veri:', JSON.stringify(body, null, 2));
    
    // Odanın var olup olmadığını kontrol et
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });
    
    if (!existingRoom) {
      return NextResponse.json(
        { success: false, message: 'Güncellenecek oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Transaction kullanarak güncelleme yap
    const result = await prisma.$transaction(async (tx) => {
      // Güncellenecek veriyi hazırla
      const roomData: any = {};
      
      // Temel bilgileri güncelle
      if (body.nameTR !== undefined) roomData.nameTR = body.nameTR;
      if (body.nameEN !== undefined) roomData.nameEN = body.nameEN;
      if (body.descriptionTR !== undefined) roomData.descriptionTR = body.descriptionTR;
      if (body.descriptionEN !== undefined) roomData.descriptionEN = body.descriptionEN;
      
      // Görsel alanı - hem image hem mainImageUrl destekle
      if (body.image !== undefined) roomData.mainImageUrl = body.image;
      else if (body.mainImageUrl !== undefined) roomData.mainImageUrl = body.mainImageUrl;
      
      if (body.priceTR !== undefined) roomData.priceTR = body.priceTR;
      if (body.priceEN !== undefined) roomData.priceEN = body.priceEN;
      if (body.capacity !== undefined) roomData.capacity = body.capacity;
      if (body.size !== undefined) roomData.size = body.size;
      if (body.featuresTR !== undefined) roomData.featuresTR = body.featuresTR;
      if (body.featuresEN !== undefined) roomData.featuresEN = body.featuresEN;
      if (body.type !== undefined) roomData.type = body.type;
      if (body.roomTypeId !== undefined) roomData.roomTypeId = body.roomTypeId;
      if (body.active !== undefined) roomData.active = body.active;
      
      // Sıra numarası - hem order hem orderNumber destekle
      if (body.order !== undefined) roomData.orderNumber = body.order;
      else if (body.orderNumber !== undefined) roomData.orderNumber = body.orderNumber;
      
      console.log('Güncellenecek veriler:', roomData);
      
      // Odayı güncelle
      const updatedRoom = await tx.room.update({
        where: { id },
        data: roomData
      });
      
      // Galeri görsellerini güncelle (eğer gönderilmişse)
      if (Array.isArray(body.gallery)) {
        // Mevcut galeri öğelerini sil
        await tx.roomGallery.deleteMany({
          where: { roomId: id }
        });
        
        // Yeni galeri öğelerini ekle
        const galleryItems = body.gallery.map((url, index) => ({
          id: generateUUID(),
          roomId: id,
          imageUrl: url,
          orderNumber: index + 1
        }));
        
        // Toplu ekleme
        if (galleryItems.length > 0) {
          await tx.roomGallery.createMany({
            data: galleryItems
          });
        }
      }
      
      // Güncellenmiş odayı getir
      const finalRoom = await tx.room.findUnique({
        where: { id },
        include: {
          gallery: {
            orderBy: { orderNumber: 'asc' },
            select: { imageUrl: true }
          }
        }
      });
      
      // Galeri görsellerini diziye dönüştür
      const galleryImages = finalRoom.gallery.map(item => item.imageUrl);
      
      // API yanıtı için veriyi formatla
      return {
        id: finalRoom.id,
        nameTR: finalRoom.nameTR,
        nameEN: finalRoom.nameEN,
        descriptionTR: finalRoom.descriptionTR,
        descriptionEN: finalRoom.descriptionEN,
        image: finalRoom.mainImageUrl,
        priceTR: finalRoom.priceTR,
        priceEN: finalRoom.priceEN,
        capacity: finalRoom.capacity,
        size: finalRoom.size,
        featuresTR: finalRoom.featuresTR,
        featuresEN: finalRoom.featuresEN,
        type: finalRoom.type,
        roomTypeId: finalRoom.roomTypeId,
        active: finalRoom.active,
        order: finalRoom.orderNumber,
        gallery: galleryImages
      };
    });
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Oda başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Oda güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: `Oda güncellenirken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Odayı sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Next.js 15 uyumluluğu için connection() çağırarak dinamik içerik işlemini başlat
  await connection();
  
  // Next.js 15 uyumluluğu için params'ı await etmeliyiz
  const resolvedParams = await params;
  
  // Params değerlerini güvenli bir şekilde kullan
  const id = resolvedParams.id;
  
  try {
    // Transaction kullanarak silme
    await prisma.$transaction(async (tx) => {
      // Odanın var olup olmadığını kontrol et
      const existingRoom = await tx.room.findUnique({
        where: { id }
      });
      
      if (!existingRoom) {
        throw new Error('Silinecek oda bulunamadı');
      }
      
      // Önce odaya ait galeri öğelerini sil
      await tx.roomGallery.deleteMany({
        where: { roomId: id }
      });
    
      // Odayı sil
      await tx.room.delete({
        where: { id }
      });
      
      // Diğer odaların sıra numaralarını güncelle
      const remainingRooms = await tx.room.findMany({
        orderBy: { orderNumber: 'asc' }
      });
      
      // Her oda için sıra numarasını güncelle
      for (let i = 0; i < remainingRooms.length; i++) {
        await tx.room.update({
          where: { id: remainingRooms[i].id },
          data: { orderNumber: i + 1 }
        });
      }
    });
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    
    return NextResponse.json({
      success: true,
      message: 'Oda başarıyla silindi'
    });
  } catch (error) {
    console.error('Oda silme hatası:', error);
    
    if (error.message === 'Silinecek oda bulunamadı') {
      return NextResponse.json(
        { success: false, message: 'Silinecek oda bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Oda silinirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
