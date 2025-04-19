import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { notifyRoomsUpdated, notifyGalleryUpdated } from '../../../websocket/route';
import { generateUUID } from '../../../../../lib/utils';

// Prisma istemcisi oluşturalım
const prisma = new PrismaClient();

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
    const room = await prisma.room.findUnique({
      where: { id },
      select: {
        mainImageUrl: true,
        gallery: {
          select: { imageUrl: true },
          orderBy: { orderNumber: 'asc' }
        }
      }
    });
    
    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        mainImage: room.mainImageUrl,
        gallery: room.gallery.map(item => item.imageUrl)
      }
    });
  } catch (error) {
    console.error('Galeri verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri verisi alınamadı' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
    const room = await prisma.room.findUnique({
      where: { id }
    });
    
    if (!room) {
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
    
    // Transaction kullanarak güncelleme yap
    const updatedRoom = await prisma.$transaction(async (tx) => {
      // Ana görseli güncelle
      if (mainImageUrl) {
        await tx.room.update({
          where: { id },
          data: { mainImageUrl }
        });
      }
      
      // Mevcut galeri öğelerini sil
      await tx.roomGallery.deleteMany({
        where: { roomId: id }
      });
      
      // Yeni galeri öğelerini ekle
      if (galleryUrls.length > 0) {
        const galleryItems = galleryUrls.map((url, index) => ({
          id: generateUUID(),
          roomId: id,
          imageUrl: url,
          orderNumber: index + 1
        }));
        
        await tx.roomGallery.createMany({
          data: galleryItems
        });
      }
      
      // Güncellenmiş odayı getir
      return await tx.room.findUnique({
        where: { id },
        include: {
          gallery: {
            orderBy: { orderNumber: 'asc' },
            select: { imageUrl: true }
          }
        }
      });
    });
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      data: {
        mainImage: updatedRoom.mainImageUrl,
        gallery: updatedRoom.gallery.map(item => item.imageUrl)
      },
      message: 'Galeri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
    const room = await prisma.room.findUnique({
      where: { id }
    });
    
    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Görsel zaten galeriye eklenmiş mi kontrol et
    const existingImage = await prisma.roomGallery.findFirst({
      where: {
        roomId: id,
        imageUrl: imagePath
      }
    });
    
    if (existingImage) {
      return NextResponse.json({
        success: false,
        message: 'Bu görsel zaten galeride mevcut'
      });
    }
    
    // Toplam galeri öğesi sayısını bul
    const galleryCount = await prisma.roomGallery.count({
      where: { roomId: id }
    });
    
    // Görseli galeriye ekle
    const newGalleryItem = await prisma.roomGallery.create({
      data: {
        id: generateUUID(),
        roomId: id,
        imageUrl: imagePath,
        orderNumber: galleryCount + 1
      }
    });
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      data: newGalleryItem,
      message: 'Görsel galeriye eklendi'
    });
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görsel eklenirken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
    const room = await prisma.room.findUnique({
      where: { id }
    });
    
    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Görseli sil
    const deletedImage = await prisma.roomGallery.deleteMany({
      where: {
        roomId: id,
        imageUrl: imagePath
      }
    });
    
    if (deletedImage.count === 0) {
      return NextResponse.json({
        success: false,
        message: 'Görsel bulunamadı'
      });
    }
    
    // Kalan görsellerin sıra numaralarını yeniden düzenle
    await prisma.$transaction(async (tx) => {
      // Geriye kalan görselleri sırala
      const remainingImages = await tx.roomGallery.findMany({
        where: { roomId: id },
        orderBy: { orderNumber: 'asc' }
      });
      
      // Her görsel için sıra numarasını güncelle
      for (let i = 0; i < remainingImages.length; i++) {
        await tx.roomGallery.update({
          where: { id: remainingImages[i].id },
          data: { orderNumber: i + 1 }
        });
      }
    });
    
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
  } finally {
    await prisma.$disconnect();
  }
}
