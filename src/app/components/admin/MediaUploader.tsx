'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaTimes, FaSpinner, FaImage, FaVideo } from 'react-icons/fa';

interface MediaUploaderProps {
  onMediaUploaded: (fileUrl: string, fileType: string) => void;
  folder?: string;
  existingMedia?: string;
  className?: string;
  type?: 'all' | 'image' | 'video'; // Hangi tip medyayı kabul edeceği
  maxSize?: number; // MB cinsinden
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onMediaUploaded,
  folder = 'slider',
  existingMedia = '',
  className = '',
  type = 'all',
  maxSize = 50 // Varsayılan 50MB
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(existingMedia || '');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    existingMedia && typeof existingMedia === 'string' && existingMedia.includes('/videos/') 
      ? 'video' 
      : 'image'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Dosya boyutu ${maxSize}MB'ı geçemez.`);
      return;
    }

    // Dosya tipi kontrolü
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (type === 'image' && !isImage) {
      setError('Sadece resim dosyaları kabul edilir (JPG, PNG, WebP).');
      return;
    }

    if (type === 'video' && !isVideo) {
      setError('Sadece video dosyaları kabul edilir (MP4, WebM, OGG).');
      return;
    }

    if (type === 'all' && !isImage && !isVideo) {
      setError('Sadece resim veya video dosyaları kabul edilir.');
      return;
    }

    // Önizleme URL'i oluştur
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMediaType(isImage ? 'image' : 'video');

    // API'ye yükleme işlemi
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('type', isImage ? 'image' : 'video');

      // API endpoint
      const apiEndpoint = '/api/upload';
      
      console.log(`Medya yükleniyor: ${file.name}, boyut: ${file.size}, tür: ${file.type}, API: ${apiEndpoint}, folder: ${folder}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API yanıt hatası:', response.status, data);
        throw new Error(data.message || data.error || `Yükleme hatası (${response.status}): Sunucu beklenen yanıtı döndürmedi`);
      }

      console.log('Yükleme yanıtı:', data);

      // Başarıyla yüklendi, URL'i parent bileşene bildir
      if (data.success && data.fileUrl) {
        console.log('Yükleme başarılı:', data.fileUrl);
        onMediaUploaded(data.fileUrl, data.fileType || (isImage ? 'image' : 'video'));
      } else {
        console.error('Dosya URL eksik:', data);
        throw new Error('Yükleme yanıtında dosya URL\'i bulunamadı');
      }
    } catch (error: any) {
      console.error('Yükleme hatası:', error);
      
      // Hata mesajı detaylı oluşturma
      let errorMessage = 'Yükleme işlemi başarısız oldu';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      setError(errorMessage);
      
      // Hata durumunda önizlemeyi kaldır
      if (previewUrl && !existingMedia) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      } else if (existingMedia) {
        setPreviewUrl(existingMedia);
        setMediaType(existingMedia.includes('/videos/') ? 'video' : 'image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (previewUrl && previewUrl !== existingMedia) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl('');
    setError(''); // Hata mesajını da temizle
    onMediaUploaded('', ''); // URL'i sıfırla
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Kabul edilen dosya türleri için attribute oluştur
  const getAcceptAttribute = () => {
    if (type === 'image') return 'image/jpeg,image/png,image/webp,image/jpg';
    if (type === 'video') return 'video/mp4,video/webm,video/ogg';
    return 'image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/webm,video/ogg';
  };

  return (
    <div className={`media-uploader ${className}`}>
      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 mb-3 rounded-md text-sm">
          {error}
          <button 
            className="ml-2 text-xs underline hover:text-red-800"
            onClick={() => setError('')}
          >
            Kapat
          </button>
        </div>
      )}

      {/* Görsel/Video önizleme alanı */}
      <div className="relative border rounded-lg bg-gray-50 p-2 overflow-hidden">
        {previewUrl ? (
          <div className="relative">
            {mediaType === 'image' ? (
              <img 
                src={previewUrl} 
                alt="Önizleme" 
                className="w-full h-52 object-contain rounded-md"
                onError={() => setError('Medya yüklenirken hata oluştu')}
              />
            ) : (
              <video 
                src={previewUrl}
                controls
                className="w-full h-52 object-contain rounded-md" 
                onError={() => setError('Video yüklenirken hata oluştu')}
              />
            )}
            <button 
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              aria-label="Medyayı kaldır"
            >
              <FaTimes size={14} />
            </button>
          </div>
        ) : (
          <div 
            className="w-full h-52 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            onClick={handleBrowseClick}
          >
            {type === 'image' ? (
              <FaImage className="text-3xl text-gray-400" />
            ) : type === 'video' ? (
              <FaVideo className="text-3xl text-gray-400" />
            ) : (
              <FaUpload className="text-3xl text-gray-400" />
            )}
            
            <p className="text-gray-500 text-sm font-medium">
              {type === 'image' 
                ? 'Görsel Yüklemek İçin Tıklayın' 
                : type === 'video' 
                  ? 'Video Yüklemek İçin Tıklayın' 
                  : 'Medya Yüklemek İçin Tıklayın'}
            </p>
            <p className="text-gray-400 text-xs">
              {type === 'image' 
                ? 'PNG, JPG veya WebP (max. 5MB)' 
                : type === 'video' 
                  ? 'MP4, WebM veya OGG (max. 50MB)' 
                  : 'Görsel veya Video (max. 50MB)'}
            </p>
          </div>
        )}

        {/* Yükleme göstergesi overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md">
            <div className="flex flex-col items-center gap-2">
              <FaSpinner className="animate-spin text-white text-2xl" />
              <span className="text-white text-sm">Yükleniyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Gizli dosya input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept={getAcceptAttribute()}
        className="hidden"
        disabled={uploading}
      />

      {/* Kontrol butonları */}
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={handleBrowseClick}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <FaUpload size={12} />
          {previewUrl 
            ? mediaType === 'image' 
              ? 'Görseli Değiştir' 
              : 'Videoyu Değiştir'
            : type === 'image'
              ? 'Görsel Seç'
              : type === 'video'
                ? 'Video Seç'
                : 'Medya Seç'
          }
        </button>
      </div>
    </div>
  );
};

export default MediaUploader; 