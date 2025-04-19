'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FaCloudUploadAlt, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export interface SliderUploaderProps {
  onUploadComplete: (imageUrl: string) => void;
  bgImageUrl?: string;
}

const SliderUploader: React.FC<SliderUploaderProps> = ({ 
  onUploadComplete,
  bgImageUrl = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(bgImageUrl);
  
  // Yükleme işlemini başlat
  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Sadece resim dosyalarına izin ver
    if (!file.type.startsWith('image/')) {
      setError('Lütfen sadece resim dosyası seçin');
      toast({
        title: 'Hata',
        description: 'Lütfen sadece resim dosyası seçin',
        variant: 'destructive'
      });
      return;
    }
    
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
      toast({
        title: 'Hata',
        description: 'Dosya boyutu 5MB\'dan küçük olmalıdır',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Form Data oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'slider');
      
      // API'ye yükle
      console.log('Slider dosyası yükleniyor...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yükleme hatası:', errorText);
        throw new Error(`Dosya yüklenemedi: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Yükleme başarısız oldu');
      }
      
      console.log('Dosya başarıyla yüklendi:', data);
      
      // Yükleme başarılı
      setUploadedImageUrl(data.url);
      onUploadComplete(data.url);
      
      toast({
        title: 'Başarılı',
        description: 'Slider görseli başarıyla yüklendi',
        variant: 'default'
      });
    } catch (err) {
      console.error('Yükleme hatası:', err);
      const errorMessage = err instanceof Error ? err.message : 'Dosya yüklenirken bir hata oluştu';
      setError(errorMessage);
      
      toast({
        title: 'Yükleme Hatası',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Dosya seçimi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };
  
  // Dosya sürükle bırak
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };
  
  // Önizlemeyi kaldır
  const clearImage = () => {
    setUploadedImageUrl('');
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="w-full">
      {!uploadedImageUrl ? (
        <div
          className={`border-2 border-dashed ${
            error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
          } rounded-lg p-6 text-center transition-colors duration-200 ease-in-out cursor-pointer hover:bg-gray-100`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
          />
          
          <div className="space-y-2 py-4">
            {uploading ? (
              <>
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">Yükleniyor...</p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  {error ? (
                    <FaExclamationTriangle className="w-10 h-10 text-red-500" />
                  ) : (
                    <FaCloudUploadAlt className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Slider görseli eklemek için tıklayın veya sürükleyin
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG veya WEBP. 5MB'a kadar.
                </p>
                {error && <p className="text-xs text-red-500">{error}</p>}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <div className="aspect-[16/9] w-full relative">
            <Image
              src={uploadedImageUrl}
              alt="Slider Görseli"
              fill
              className="object-cover"
            />
          </div>
          
          <div className="absolute top-2 right-2 space-x-2">
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8 rounded-full shadow-md bg-opacity-75"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
            <FaCheck className="mr-1" /> Yüklendi
          </div>
        </div>
      )}
    </div>
  );
};

export default SliderUploader; 