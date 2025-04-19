import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// API'nin dinamik olduğunu belirt - her seferinde yeniden oluşturulsun
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // İşlem süresini 60 saniyeye çıkar

// S3 istemcisini yapılandır (tebi.io için)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://s3.tebi.io',
  credentials: {
    accessKeyId: process.env.TEBI_API_KEY || '',
    secretAccessKey: process.env.TEBI_MASTER_KEY || ''
  }
});

// Bucket adı
const bucketName = process.env.TEBI_BUCKET || 'dogahotelfethiye';

// İzin verilen dosya tipleri
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif',
  'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime'
];

// Yüklenebilecek maksimum dosya boyutu (25MB)
const MAX_FILE_SIZE = 25 * 1024 * 1024; 

export async function POST(request: NextRequest) {
  console.log('[Tebi Upload API] Dosya yükleme isteği alındı');
  
  try {
    // Form verilerini al
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB yüklenebilir.` },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomId = formData.get('roomId') as string || '';
    const folder = formData.get('folder') as string || 'uploads';
    
    console.log('[Tebi Upload API] Form verileri:', { 
      dosyaVar: !!file, 
      roomId, 
      folder,
      dosyaAdı: file?.name,
      dosyaTipi: file?.type,
      boyut: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Yok'
    });
    
    // Dosya kontrolü
    if (!file) {
      console.error('[Tebi Upload API] Dosya bulunamadı');
      return NextResponse.json(
        { success: false, message: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }
    
    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('[Tebi Upload API] Geçersiz dosya tipi:', file.type);
      return NextResponse.json(
        { success: false, message: `Geçersiz dosya formatı: ${file.type}. İzin verilen tipler: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      console.error('[Tebi Upload API] Dosya çok büyük:', file.size);
      return NextResponse.json(
        { success: false, message: `Dosya boyutu ${MAX_FILE_SIZE / (1024 * 1024)}MB'ı geçemez` },
        { status: 400 }
      );
    }
    
    console.log(`[Tebi Upload API] Dosya işleniyor - İsim: ${file.name}, Tür: ${file.type}, Boyut: ${file.size} bytes`);
    
    // Dosya içeriğini buffer'a dönüştür
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Benzersiz dosya adı oluştur
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileId = uuidv4();
    const fileName = `${folder}/${fileId}.${fileExtension}`;
    
    // S3 yükleme parametreleri
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' // Herkese açık erişim
    };
    
    console.log(`[Tebi Upload API] S3'e yükleniyor: ${fileName}`);
    
    try {
      // Dosyayı S3'e yükle
      await s3Client.send(new PutObjectCommand(params));
      
      // Dosya URL'ini oluştur
      const fileUrl = `https://${bucketName}.s3.tebi.io/${fileName}`;
      console.log(`[Tebi Upload API] Dosya başarıyla yüklendi: ${fileUrl}`);
      
      // Başarılı yanıt döndür
      return NextResponse.json({
        success: true,
        url: fileUrl,
        fileId: fileId,
        message: 'Dosya başarıyla yüklendi'
      });
    } catch (s3Error) {
      console.error('[Tebi Upload API] S3 yükleme hatası:', s3Error);
      return NextResponse.json(
        { success: false, message: 'Dosya S3 sunucusuna yüklenirken bir hata oluştu', error: s3Error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Tebi Upload API] Dosya yükleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Dosya yüklenirken bir hata oluştu', error: error.message },
      { status: 500 }
    );
  }
}
