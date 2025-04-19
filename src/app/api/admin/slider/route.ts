import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllSliderData, getSliderById, addSlider, updateSlider, deleteSlider } from '@/app/data/admin/sliderData';
import { getCurrentAdminUser } from '@/app/data/admin/auth';

// API'nin dinamik olduğunu belirt
export const dynamic = 'force-dynamic';

// GET: Tüm slider öğelerini getir
export async function GET(request: NextRequest) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    
    if (id) {
      // Belirli bir slider öğesini getir
      const sliderItem = await getSliderById(id);
      
      if (!sliderItem) {
        return NextResponse.json(
          { success: false, message: 'Slider öğesi bulunamadı' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: sliderItem });
    }
    
    // Tüm slider öğelerini getir
    const sliderItems = await getAllSliderData();
    return NextResponse.json({ success: true, data: sliderItems });
  } catch (error) {
    console.error('Slider verileri alınırken hata oluştu:', error);
    return NextResponse.json(
      { success: false, message: 'Slider verileri alınırken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// POST: Yeni slider öğesi ekle
export async function POST(request: NextRequest) {
  try {
    // Yönetici kullanıcısını kontrol et
    const cookieStore = cookies();
    const adminUser = await getCurrentAdminUser(cookieStore);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' }, 
        { status: 401 }
      );
    }
    
    // İstek verilerini al
    const data = await request.json();
    
    // Gerekli alanları kontrol et
    if ((!data.titleTR && !data.titleEN) || !data.image) {
      return NextResponse.json(
        { success: false, message: 'Başlık (TR veya EN) ve görsel gereklidir' },
        { status: 400 }
      );
    }
    
    // Yeni slider öğesi ekle
    const newSlider = await addSlider({
      titleTR: data.titleTR || '',
      titleEN: data.titleEN || '',
      subtitleTR: data.subtitleTR || '',
      subtitleEN: data.subtitleEN || '',
      descriptionTR: data.descriptionTR || '',
      descriptionEN: data.descriptionEN || '',
      image: data.image,
      videoUrl: data.videoUrl || '',
      active: data.active !== undefined ? data.active : true,
      order: data.order || 0
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Slider öğesi başarıyla eklendi', 
      data: newSlider 
    });
  } catch (error) {
    console.error('Slider eklenirken hata oluştu:', error);
    return NextResponse.json(
      { success: false, message: 'Slider eklenirken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// PUT: Mevcut slider öğesini güncelle
export async function PUT(request: NextRequest) {
  try {
    // Yönetici kullanıcısını kontrol et
    const cookieStore = cookies();
    const adminUser = await getCurrentAdminUser(cookieStore);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' }, 
        { status: 401 }
      );
    }
    
    // İstek verilerini al
    const data = await request.json();
    
    // Slider ID'sini kontrol et
    if (!data.id) {
      return NextResponse.json(
        { success: false, message: 'Slider ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Slider öğesini güncelle
    const updatedSlider = await updateSlider(data.id, {
      titleTR: data.titleTR,
      titleEN: data.titleEN,
      subtitleTR: data.subtitleTR,
      subtitleEN: data.subtitleEN,
      descriptionTR: data.descriptionTR,
      descriptionEN: data.descriptionEN,
      image: data.image,
      videoUrl: data.videoUrl,
      active: data.active,
      order: data.order
    });
    
    if (!updatedSlider) {
      return NextResponse.json(
        { success: false, message: 'Slider öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Slider öğesi başarıyla güncellendi', 
      data: updatedSlider 
    });
  } catch (error) {
    console.error('Slider güncellenirken hata oluştu:', error);
    return NextResponse.json(
      { success: false, message: 'Slider güncellenirken bir hata oluştu' }, 
      { status: 500 }
    );
  }
}

// DELETE: Slider öğesini sil
export async function DELETE(request: NextRequest) {
  try {
    // Yönetici kullanıcısını kontrol et
    const cookieStore = cookies();
    const adminUser = await getCurrentAdminUser(cookieStore);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' }, 
        { status: 401 }
      );
    }
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Slider ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Slider öğesini sil
    const deleted = await deleteSlider(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Slider öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Slider öğesi başarıyla silindi'
    });
  } catch (error) {
    console.error('Slider silinirken hata oluştu:', error);
    return NextResponse.json(
      { success: false, message: 'Slider silinirken bir hata oluştu' }, 
      { status: 500 }
    );
  }
} 