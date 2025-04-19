'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FaCloudUploadAlt, FaImage, FaVideo, FaTimesCircle } from 'react-icons/fa';
import ImageKitImage from './ImageKitImage';
import ImageKitVideo from './ImageKitVideo';

interface MediaUploaderProps {
  onUpload: (result: { url: string; fileId: string; fileType: string; thumbnailUrl?: string }) => void;
  initialUrl?: string;
  type?: 'image' | 'video' | 'any';
  maxSizeMB?: number;
  label?: string;
  folder?: string;
  className?: string;
  errorMessage?: string;
  apiEndpoint?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  initialUrl = '',
  type = 'any',
  maxSizeMB = 100,
  label = 'Medya Yükle',
  folder = 'uploads',
  className = '',
  errorMessage = '',
  apiEndpoint = '/api/upload'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState(errorMessage);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [fileType, setFileType] = useState<'image' | 'video'>(initialUrl?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dosya türüne göre MIME tipleri
  const getAcceptedFileTypes = (): string => {
    switch (type) {
      case 'image':
        return 'image/jpeg,image/png,image/webp,image/gif';
      case 'video':
        return 'video/mp4,video/webm,video/ogg,video/mov,video/quicktime';
      case 'any':
        return 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/mov,video/quicktime';
      default:
        return '';
    }
  };
  
  // Dosya seçildiğinde
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsError(false);
    setErrorText('');
    
    // Dosya türü kontrolü
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (type === 'image' && !isImage) {
      setIsError(true);
      setErrorText('Lütfen geçerli bir görsel dosyası seçin.');
      return;
    }
    
    if (type === 'video' && !isVideo) {
      setIsError(true);
      setErrorText('Lütfen geçerli bir video dosyası seçin.');
      return;
    }
    
    // Dosya boyutu kontrolü
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setIsError(true);
      setErrorText(`Dosya çok büyük. En fazla ${maxSizeMB}MB yükleyebilirsiniz.`);
      return;
    }
    
    // Yükleme işlemi için hazırlık
    setIsLoading(true);
    
    try {
      // Önizleme URL'si oluştur
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setFileType(isVideo ? 'video' : 'image');
      
      // Video ise thumbnail oluştur (opsiyonel)
      let thumbnailUrl: string = '';
      if (isVideo) {
        try {
          console.log(`Video için thumbnail oluşturuluyor: ${file.name}`);
          thumbnailUrl = await generateVideoThumbnail(file);
        } catch (thumbError) {
          console.error("Video thumbnail oluşturma hatası:", thumbError);
          // Thumbnail oluşturulamazsa devam et
        }
      }
      
      // FormData ile dosya yükleme
      console.log('FormData ile yükleme başlatılıyor...');
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      // API'ye yolla
      const uploadResponse = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Yükleme hatası:', errorText);
        throw new Error(`Dosya yüklenemedi: ${uploadResponse.status}`);
      }
      
      const responseData = await uploadResponse.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Yükleme başarısız oldu');
      }
      
      console.log('Dosya başarıyla yüklendi:', responseData);
      
      // Başarılı yükleme - handler'ı çağır
      onUpload({
        url: responseData.url,
        fileId: responseData.fileId || file.name,
        fileType: isVideo ? 'video' : 'image',
        thumbnailUrl: thumbnailUrl || undefined
      });
      
      // Önizleme URL'sini güncelle
      setPreviewUrl(responseData.url);
      setThumbnailUrl(thumbnailUrl || undefined);
    } catch (error) {
      console.error('Yükleme hatası:', error);
      setIsError(true);
      setErrorText(error instanceof Error ? error.message : 'Dosya yüklenirken bir hata oluştu');
      // Hata durumunda önizlemeyi temizle
      setPreviewUrl('');
      setThumbnailUrl(null);
      
      // Tarayıcı konsoluna daha detaylı hata mesajı
      if (error instanceof Error) {
        console.error('Detaylı hata:', {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
      }
    } finally {
      setIsLoading(false);
      // Dosya inputunu temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Dosya sürükle-bırak işlemi
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        
        // Değişikliği tetiklemek için change olayını manuel olarak tetikle
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);
  
  // Önizlemeyi temizle
  const clearPreview = () => {
    setPreviewUrl('');
    setThumbnailUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload({ url: '', fileId: '', fileType: '' });
  };
  
  /**
   * Video'dan thumbnail oluştur
   */
  const generateVideoThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("Video'dan thumbnail oluşturuluyor...");
        // Video elementi oluştur
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.muted = true;
        videoElement.playsInline = true;
        
        // Video dosyası için URL oluştur
        const videoUrl = URL.createObjectURL(file);
        videoElement.src = videoUrl;
        
        // Video metadata yüklendiğinde
        videoElement.onloadedmetadata = () => {
          // Video'nun ilk 3 saniyesine git (genellikle en iyi thumbnail için)
          videoElement.currentTime = Math.min(3, videoElement.duration / 4);
        };
        
        // Video belirtilen zamana gittikten sonra
        videoElement.onseeked = () => {
          try {
            // Canvas üzerinde video frame'ini yakala
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject("Canvas context oluşturulamadı");
              return;
            }
            
            // Video frame'ini canvas'a çiz
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Canvas içeriğini data URL'e dönüştür (JPEG formatında)
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Video URL'ini temizle
            URL.revokeObjectURL(videoUrl);
            
            console.log("Video thumbnail başarıyla oluşturuldu");
            resolve(thumbnailDataUrl);
          } catch (error) {
            console.error("Thumbnail oluşturma hatası:", error);
            reject(error);
          }
        };
        
        // Video işleme hatası
        videoElement.onerror = (e) => {
          console.error("Video işleme hatası:", e);
          URL.revokeObjectURL(videoUrl);
          reject("Video işlenemedi");
        };
        
        // Video yükleme başlatma
        videoElement.load();
      } catch (error) {
        console.error("Video thumbnail oluşturma hatası:", error);
        reject(error);
      }
    });
  };
  
  /**
   * Data URL'ini file nesnesine dönüştür
   */
  const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Medya yükleme alanı */}
      {!previewUrl ? (
        <div
          className={`border-2 border-dashed ${isError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 transition-all`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-500">Yükleniyor, lütfen bekleyin...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-4">
                <FaCloudUploadAlt className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-xs text-gray-400">Sürükle bırak veya dosya seç</p>
                {isError && <p className="text-red-500 text-xs mt-2">{errorText}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>
      ) : (
        // Önizleme alanı
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={clearPreview}
              className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-colors"
              title="Temizle"
            >
              <FaTimesCircle className="w-5 h-5" />
            </button>
          </div>
          
          {fileType === 'image' ? (
            <img
              src={previewUrl}
              alt="Önizleme"
              className="w-full object-cover"
            />
          ) : (
            <video
              src={previewUrl}
              controls
              className="w-full"
              poster={thumbnailUrl || undefined}
            >
              <source src={previewUrl} type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          )}
          
          {/* Dosya türü göstergesi */}
          <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 flex items-center">
            {fileType === 'image' ? (
              <FaImage className="w-4 h-4 mr-1" />
            ) : (
              <FaVideo className="w-4 h-4 mr-1" />
            )}
            <span className="text-xs">{fileType === 'image' ? 'Görsel' : 'Video'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader; 