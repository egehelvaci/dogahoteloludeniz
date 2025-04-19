import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// API'nin dinamik olduğunu belirt - her seferinde yeniden oluşturulsun
export const dynamic = 'force-dynamic';

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
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'
];

// Yüklenebilecek maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  console.log('[Tebi Upload API] Resim yükleme isteği alındı');
  
  try {
    // Form verilerini al
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomId = formData.get('roomId') as string || '';
    
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
        { success: false, message: 'Geçersiz dosya formatı. Sadece resim dosyaları yüklenebilir.' },
        { status: 400 }
      );
    }
    
    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      console.error('[Tebi Upload API] Dosya çok büyük:', file.size);
      return NextResponse.json(
        { success: false, message: 'Dosya boyutu 10MB\'ı geçemez' },
        { status: 400 }
      );
    }
    
    console.log(`[Tebi Upload API] Dosya işleniyor - İsim: ${file.name}, Tür: ${file.type}, Boyut: ${file.size} bytes`);
    
    // Dosya içeriğini buffer'a dönüştür
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Benzersiz dosya adı oluştur
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `rooms/${roomId || 'default'}/${uuidv4()}.${fileExtension}`;
    
    // S3 yükleme parametreleri
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read' // Herkese açık erişim
    };
    
    // Dosyayı S3'e yükle
    await s3Client.send(new PutObjectCommand(params));
    
    // Dosya URL'ini oluştur
    const fileUrl = `https://${bucketName}.s3.tebi.io/${fileName}`;
    console.log(`[Tebi Upload API] Dosya başarıyla yüklendi: ${fileUrl}`);
    
    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'Dosya başarıyla yüklendi'
    });
  } catch (error) {
    console.error('[Tebi Upload API] Dosya yükleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
