import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

// Tebi.io için konfigürasyon
// Tebi, S3, FTP/FTPS ve DataStream protokollerini destekler
// GeoDNS ile otomatik olarak en yakın veri merkezine yönlendirilir

// S3 protokolü için endpoint - global erişim için s3.tebi.io
const S3_ENDPOINT = "https://s3.tebi.io";

// Bucket bilgileri - .env.local'dan alınır
const BUCKET_NAME = process.env.TEBI_BUCKET?.trim();

// Kimlik bilgileri - çevre değişkenlerinden güvenli bir şekilde al
// S3 API için: accessKeyId = Bucket Key, secretAccessKey = Bucket Secret
const BUCKET_KEY = process.env.TEBI_API_KEY?.trim();
const BUCKET_SECRET = process.env.TEBI_MASTER_KEY?.trim();

// Ortam değişkenlerini ayrıntılı olarak logla - sorun tespiti için
console.log('Tebi.io Konfigürasyon Detayları:', {
  endpoint: S3_ENDPOINT,
  bucket: BUCKET_NAME,
  keyLength: BUCKET_KEY?.length,
  secretLength: BUCKET_SECRET?.length,
  keyProvided: !!BUCKET_KEY,
  secretProvided: !!BUCKET_SECRET,
  keyFirstChars: BUCKET_KEY?.substring(0, 5) + '...',
  secretFirstChars: BUCKET_SECRET?.substring(0, 5) + '...',
});

// S3 istemcisi oluştur
const getS3Client = () => {
  // Kimlik bilgilerini kontrol et
  if (!BUCKET_KEY || !BUCKET_SECRET || !BUCKET_NAME) {
    console.error("Tebi.io yapılandırma hatası: Eksik kimlik bilgileri");
    throw new Error("Tebi.io kimlik bilgileri eksik. Lütfen çevre değişkenlerini kontrol edin.");
  }
  
  // S3 istemcisi oluştur - kimlik bilgilerini loglamadan
  console.log("Tebi.io S3 bağlantısı hazırlanıyor");
  
  try {
    return new S3Client({
      region: "auto", // GeoDNS otomatik olarak yönlendirir
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: BUCKET_KEY, 
        secretAccessKey: BUCKET_SECRET
      },
      forcePathStyle: true, // S3 uyumlu API için gerekli
      maxAttempts: 3 // Başarısızlık durumunda en fazla 3 deneme yap
    });
  } catch (error) {
    console.error("Tebi.io S3 istemcisi oluşturma hatası:", error);
    throw new Error("S3 istemcisi oluşturulamadı: " + 
      (error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
};

// Dosyayı Tebi.io'ya yükleme - sadece sunucu tarafında çalışır
export async function uploadToTebi(params: {
  file: File;
  maxSizeInBytes?: number;
  checkFileType?: boolean;
  allowedFileTypes?: string[];
  path: string;
}): Promise<{ success: boolean; fileUrl: string; message?: string }> {
  const { file, maxSizeInBytes, checkFileType, allowedFileTypes, path } = params;

  // Ortam değişkenlerini kontrol et
  const apiKey = process.env.TEBI_API_KEY;
  const masterKey = process.env.TEBI_MASTER_KEY;
  const bucket = process.env.TEBI_BUCKET;

  console.log('Tebi Yükleme: Yapılandırma kontrol ediliyor', { 
    apiKeyExists: !!apiKey, 
    masterKeyExists: !!masterKey,
    bucket
  });

  if (!apiKey || !masterKey || !bucket) {
    console.error('Tebi Yükleme: Eksik ortam değişkenleri', { 
      apiKeyExists: !!apiKey, 
      masterKeyExists: !!masterKey, 
      bucketExists: !!bucket 
    });
    return {
      success: false,
      fileUrl: '',
      message: 'Depolama servisi yapılandırması eksik. Lütfen yöneticinize başvurun.'
    };
  }

  // Dosya boyutunu kontrol et
  if (maxSizeInBytes && file.size > maxSizeInBytes) {
    const maxSizeMB = Math.round(maxSizeInBytes / (1024 * 1024));
    return {
      success: false,
      fileUrl: '',
      message: `Dosya boyutu çok büyük. Maksimum dosya boyutu: ${maxSizeMB}MB`
    };
  }

  // Dosya türünü kontrol et
  if (checkFileType && allowedFileTypes && allowedFileTypes.length > 0) {
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFileTypes.includes(fileType)) {
      return {
        success: false,
        fileUrl: '',
        message: `Desteklenmeyen dosya türü. İzin verilen dosya türleri: ${allowedFileTypes.join(', ')}`
      };
    }
  }

  // Dosya adını temizle
  const fileName = slugify(file.name, {
    replacement: '_',
    lower: true,
    strict: true,
    trim: true
  });

  try {
    // Dosyanın içerik türünü belirle
    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = fileName.split('.').pop()?.toLowerCase();
      contentType = extension ? getMimeType(extension) : 'application/octet-stream';
    }

    console.log('Tebi Yükleme: Dosya bilgileri', { 
      fileName, 
      contentType, 
      fileSize: file.size, 
      uploadPath: path 
    });

    // S3 istemcisini yapılandır
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://s3.tebi.io`,
      credentials: {
        accessKeyId: apiKey,
        secretAccessKey: masterKey
      }
    });

    const fullPath = `${path}/${fileName}`;
    console.log(`Tebi Yükleme: Dosya yükleniyor... Tam yol: ${fullPath}`);

    // Dosyayı ArrayBuffer'a dönüştür
    const arrayBuffer = await file.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);

    // S3 komutunu oluştur
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fullPath,
      Body: bodyBuffer,
      ContentType: contentType
    });

    // Dosyayı yükle
    console.log('Tebi Yükleme: S3 komutu çalıştırılıyor...');
    console.log('Tebi Yükleme: Kullanılan Kimlik Bilgileri:', {
      bucket: bucket,
      apiKey: apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5),
      masterKeyLength: masterKey.length,
      endpoint: `https://s3.tebi.io`
    });
    
    const response = await s3Client.send(command);
    console.log('Tebi Yükleme: S3 yanıtı alındı', response);

    // Başarılı yanıt oluştur
    const fileUrl = `https://${bucket}.s3.tebi.io/${fullPath}`;
    console.log(`Tebi Yükleme: Başarılı! URL: ${fileUrl}`);

    return {
      success: true,
      fileUrl
    };
  } catch (error) {
    console.error('Tebi Yükleme: Hata oluştu', error);
    return {
      success: false,
      fileUrl: '',
      message: error instanceof Error ? error.message : 'Dosya yükleme sırasında beklenmeyen bir hata oluştu'
    };
  }
}

// Dosyayı Tebi.io'dan silme
export const deleteFromTebi = async (fileId: string) => {
  try {
    // Kimlik bilgilerini yeniden kontrol et
    if (!BUCKET_KEY || !BUCKET_SECRET || !BUCKET_NAME) {
      throw new Error('Tebi.io yapılandırması eksik. Lütfen çevre değişkenlerini kontrol edin.');
    }

    // FileId'yi güvenli hale getir
    const sanitizedFileId = fileId.replace(/[^a-zA-Z0-9-_/.]/g, '-');
    
    console.log('Tebi.io: Silme işlemi başlatılıyor', {
      dosyaYolu: sanitizedFileId
    });
    
    // S3 istemcisini oluştur
    const s3Client = getS3Client();
    
    // S3 silme komutu oluştur
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sanitizedFileId
    });
    
    // Silme işlemini gerçekleştir
    console.log('Tebi.io: S3 silme isteği gönderiliyor');
    const response = await s3Client.send(command);
    
    console.log('Tebi.io: Silme başarılı');
    
    // Başarılı dönüş
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Tebi.io Silme Hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    
    // Hata dönüşü - hassas bilgiler olmadan
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Dosya uzantısına göre MIME türü belirle
function getMimeType(extension: string): string {
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'ico': 'image/x-icon',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

// Pre-signed URL oluşturma fonksiyonu
export async function createPresignedUrl(params: {
  fileName: string;
  contentType: string;
  path: string;
  expiresIn?: number;
}): Promise<{ success: boolean; uploadUrl?: string; fileKey?: string; fileUrl?: string; message?: string }> {
  const { fileName, contentType, path, expiresIn = 600 } = params; // 10 dakika varsayılan süre
  
  try {
    // Ortam değişkenlerini kontrol et
    const apiKey = process.env.TEBI_API_KEY?.trim();
    const masterKey = process.env.TEBI_MASTER_KEY?.trim();
    const bucket = process.env.TEBI_BUCKET?.trim();
    
    console.log('Tebi Pre-signed URL: Yapılandırma kontrol ediliyor', { 
      apiKeyExists: !!apiKey, 
      masterKeyExists: !!masterKey, 
      bucket,
      apiKeyLength: apiKey?.length,
      masterKeyLength: masterKey?.length
    });
    
    if (!apiKey || !masterKey || !bucket) {
      const missingVars = [];
      if (!apiKey) missingVars.push('TEBI_API_KEY');
      if (!masterKey) missingVars.push('TEBI_MASTER_KEY');
      if (!bucket) missingVars.push('TEBI_BUCKET');
      
      console.error(`Tebi Pre-signed URL: Eksik ortam değişkenleri: ${missingVars.join(', ')}`);
      return {
        success: false,
        message: `Depolama servisi yapılandırması eksik: ${missingVars.join(', ')} değişkenleri bulunamadı.`
      };
    }
    
    // Dosya adını temizle ve benzersiz bir isim oluştur
    const cleanFileName = slugify(fileName, {
      replacement: '_',
      lower: true,
      strict: true,
      trim: true
    });
    
    // Benzersiz bir dosya adı oluştur
    const uniqueId = uuidv4().substring(0, 8);
    const finalFileName = `${Date.now()}_${uniqueId}_${cleanFileName}`;
    const fileKey = `${path}/${finalFileName}`;
    
    console.log('Tebi Pre-signed URL: İstemci oluşturuluyor', {
      region: 'auto',
      endpoint: 'https://s3.tebi.io',
      fileKey,
      contentType,
      expiresIn
    });
    
    try {
      // S3 istemcisini yapılandır
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: 'https://s3.tebi.io',
        credentials: {
          accessKeyId: apiKey,
          secretAccessKey: masterKey
        },
        forcePathStyle: true
      });
      
      // Yükleme komutu oluştur
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        ContentType: contentType
      });
      
      // Pre-signed URL oluştur
      console.log('Tebi Pre-signed URL: URL oluşturuluyor...');
      const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn });
      const fileUrl = `https://${bucket}.s3.tebi.io/${fileKey}`;
      
      console.log('Tebi Pre-signed URL: Başarıyla oluşturuldu', {
        fileKey,
        urlLength: uploadUrl.length,
        expiresIn,
        contentType
      });
      
      return {
        success: true,
        uploadUrl,
        fileKey,
        fileUrl
      };
    } catch (clientError) {
      console.error('Tebi Pre-signed URL: S3 istemcisi hatası', clientError);
      return {
        success: false,
        message: clientError instanceof Error 
          ? `S3 istemcisi hatası: ${clientError.message}` 
          : 'S3 istemcisi oluşturulurken beklenmeyen bir hata oluştu'
      };
    }
  } catch (error) {
    console.error('Tebi Pre-signed URL: Oluşturma hatası', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Pre-signed URL oluşturulurken bir hata oluştu'
    };
  }
} 