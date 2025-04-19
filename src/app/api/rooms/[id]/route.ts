import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notifyRoomsUpdated } from '../../websocket/route';
import { generateUUID } from '../../../../lib/utils';
import { connection } from 'next/server';

// Prisma istemcisi oluştur
const prisma = new PrismaClient();

// Tüm API isteklerini dinamik olarak yap
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Belirli bir odayı ID'ye göre getir
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Next.js 15 uyumluluğu için connection() çağırarak dinamik içerik işlemini başlat
  await connection();
  
  // Params değerlerini bekleyerek güvenli bir şekilde kullan
  const { id } = params;
  
  console.log('[API] Oda detay çağrısı:', id);
  
  try {
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz oda ID\'si' },
        { status: 400 }
      );
    }

    // Önce tüm aktif odaları getir
    const allRooms = await prisma.room.findMany({
      where: { active: true },
      select: { id: true, nameTR: true },
      orderBy: { orderNumber: 'asc' }
    });
    
    const availableRooms = allRooms.map(room => ({
      id: room.id,
      name: room.nameTR
    }));
    
    console.log('[API] Mevcut odalar:', JSON.stringify(availableRooms));
    
    // Verilen ID ile oda detayını getir
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        gallery: {
          orderBy: { orderNumber: 'asc' },
          select: { imageUrl: true }
        }
      }
    });
    
    if (!room) {
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
    
    // Galeri görsellerini diziye dönüştür
    const galleryImages = room.gallery.map(item => item.imageUrl);
    
    // API yanıtını oluştur
    const responseData = {
      id: room.id,
      nameTR: room.nameTR,
      nameEN: room.nameEN,
      descriptionTR: room.descriptionTR,
      descriptionEN: room.descriptionEN,
      image: room.mainImageUrl,
      priceTR: room.priceTR,
      priceEN: room.priceEN,
      capacity: room.capacity,
      size: room.size,
      featuresTR: room.featuresTR,
      featuresEN: room.featuresEN,
      type: room.type,
      active: room.active,
      gallery: galleryImages
    };
    
    console.log('[API] Oda başarıyla bulundu:', room.id);
    
    return NextResponse.json(
      { success: true, data: responseData },
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
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Odayı güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Next.js 15 uyumluluğu için connection() çağırarak dinamik içerik işlemini başlat
  await connection();
  
  // Params değerlerini güvenli bir şekilde kullan
  const { id } = params;
  
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
  
  // Params değerlerini güvenli bir şekilde kullan
  const { id } = params;
  
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
