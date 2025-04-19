'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaUpload, FaTrash, FaRegImage } from 'react-icons/fa';
import { BiSortAlt2 } from 'react-icons/bi';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getRoomById, updateRoomGallery } from '../../../../../data/admin/roomsData';

interface AdminRoomGalleryPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function AdminRoomGalleryPage({ params }: AdminRoomGalleryPageProps) {
  // Geçici çözüm: params'ı doğrudan kullan
  const lang = params.lang;
  const id = params.id;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('');
  
  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const roomItem = await getRoomById(id);
        
        if (roomItem) {
          setRoomName(roomItem.nameTR);
          setMainImage(roomItem.mainImageUrl || roomItem.image || '');
          setGallery(roomItem.gallery || []);
        } else {
          toast.error(lang === 'tr' ? 'Oda bulunamadı!' : 'Room not found!');
          router.push(`/${lang}/admin/rooms`);
        }
      } catch (error) {
        console.error('Oda galerisi yüklenirken hata:', error);
        toast.error(lang === 'tr' ? 'Galeri bilgileri yüklenirken bir hata oluştu!' : 'An error occurred while loading gallery data!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoomData();
  }, [id, lang, router]);

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang === 'tr' 
        ? 'Geçersiz dosya türü. Sadece JPEG, PNG, WebP ve GIF görsel formatları desteklenir' 
        : 'Invalid file type. Only JPEG, PNG, WebP and GIF image formats are supported');
      return;
    }
    
    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(lang === 'tr' 
        ? 'Dosya boyutu çok büyük. Maksimum dosya boyutu 10MB olabilir' 
        : 'File size is too large. Maximum file size is 10MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', id);
      
      // API'ye gönder
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      if (result.success && result.url) {
        // Dosyayı galeriye ekle
        setGallery([...gallery, result.url]);
        
        // Eğer ana görsel yoksa bu görseli ana görsel olarak ayarla
        if (!mainImage) {
          setMainImage(result.url);
        }
        
        toast.success(lang === 'tr' ? 'Görsel başarıyla yüklendi!' : 'Image uploaded successfully!');
      } else {
        console.error('API başarılı yanıt vermedi:', result);
        toast.error(result.message || (lang === 'tr' ? 'Görsel yüklenemedi!' : 'Failed to upload image!'));
      }
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error(lang === 'tr' ? `Görsel yüklenirken bir hata oluştu: ${error.message}` : `An error occurred while uploading the image: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sürükle bırak işlemi
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(gallery);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setGallery(items);
  };

  // Ana görsel ayarlama
  const setAsMainImage = (url) => {
    setMainImage(url);
    toast.success(lang === 'tr' ? 'Ana görsel güncellendi!' : 'Main image updated!');
  };

  // Görseli galeriden kaldır
  const removeFromGallery = (url) => {
    // Galeriden kaldır
    const updatedGallery = gallery.filter(img => img !== url);
    setGallery(updatedGallery);
    
    // Eğer kaldırılan ana görsel ise, yeni bir ana görsel seç
    if (url === mainImage) {
      if (updatedGallery.length > 0) {
        setMainImage(updatedGallery[0]);
      } else {
        setMainImage('');
      }
    }
    
    toast.success(lang === 'tr' ? 'Görsel kaldırıldı!' : 'Image removed!');
  };

  // Değişiklikleri kaydet
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // En az bir görsel var mı kontrolü
      if (gallery.length === 0) {
        toast.error(lang === 'tr' ? 'En az bir görsel eklemeniz gerekiyor!' : 'You need to add at least one image!');
        return;
      }
      
      // Ana görsel seçili mi kontrolü
      if (!mainImage && gallery.length > 0) {
        // Otomatik olarak ilk görseli ana görsel yap
        setMainImage(gallery[0]);
        toast.success(lang === 'tr' ? 'İlk görsel otomatik olarak ana görsel seçildi' : 'First image was automatically selected as main image');
      }
      
      console.log('Galeri güncelleniyor...', { mainImage, galleryCount: gallery.length });
      
      const result = await updateRoomGallery(id, {
        image: mainImage,
        gallery: gallery
      }).catch(error => {
        console.error('Galeri güncelleme hatası yakalandı:', error);
        throw new Error(error.message || 'Galeri güncellenemedi');
      });
      
      if (result) {
        toast.success(lang === 'tr' ? 'Galeri başarıyla güncellendi!' : 'Gallery updated successfully!');
        
        // 1 saniye bekleyip yönlendir
        setTimeout(() => {
          router.push(`/${lang}/admin/rooms/edit/${id}`);
        }, 1000);
      } else {
        throw new Error('Galeri güncellenemedi');
      }
    } catch (error) {
      console.error('Galeri güncelleme işlemi hatası:', error);
      toast.error(lang === 'tr' 
        ? `Galeri güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}` 
        : `An error occurred while updating the gallery: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center text-xl font-semibold text-gray-700">
          {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {lang === 'tr' ? 'Galeriyi Düzenle' : 'Edit Gallery'}: {roomName}
            </h1>
            <div className="flex gap-2">
              <Link
                href={`/${lang}/admin/rooms/edit/${id}`}
                className="text-teal-600 hover:text-teal-700 flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                {lang === 'tr' ? 'Oda Düzenlemeye Dön' : 'Back to Room Edit'}
              </Link>
              <Link
                href={`/${lang}/admin`}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm"
              >
                <FaArrowLeft className="mr-2" />
                {lang === 'tr' ? 'Admin Panele Dön' : 'Back to Admin Panel'}
              </Link>
            </div>
          </div>

          {/* Ana Görsel Bölümü */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              {mainImage ? (
                <div className="relative w-full max-h-80 overflow-hidden rounded-lg">
                  <img
                    src={mainImage}
                    alt={lang === 'tr' ? 'Ana görsel' : 'Main image'}
                    className="w-full h-auto object-contain mx-auto max-h-80"
                  />
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                  <FaRegImage size={48} className="mb-2" />
                  <p>{lang === 'tr' ? 'Ana görsel henüz seçilmedi' : 'No main image selected yet'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Galeriye Görsel Yükleme */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                {lang === 'tr' ? 'Galeri Görselleri' : 'Gallery Images'}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
                >
                  <FaUpload className="mr-2" />
                  {isUploading ? (
                    <span>{lang === 'tr' ? 'Yükleniyor...' : 'Uploading...'}</span>
                  ) : (
                    <span>{lang === 'tr' ? 'Görsel Yükle' : 'Upload Image'}</span>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Bilgi Mesajı */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-start">
              <BiSortAlt2 className="mr-2 mt-1 flex-shrink-0" />
              <p className="text-sm">
                {lang === 'tr' 
                  ? 'Görselleri sürükleyip bırakarak sıralayabilirsiniz. Ana görsel olarak ayarlamak için görsele tıklayın.' 
                  : 'You can drag and drop images to reorder them. Click on an image to set it as the main image.'}
              </p>
            </div>

            {/* Sürükle Bırak Galeri */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="gallery" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  >
                    {gallery.length > 0 ? (
                      gallery.map((image, index) => (
                        <Draggable key={index} draggableId={`image-${index}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                                image === mainImage ? 'border-yellow-500' : 'border-gray-200'
                              } group`}
                            >
                              <img
                                src={image}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setAsMainImage(image)}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => removeFromGallery(image)}
                                  className="p-2 bg-red-600 text-white rounded-full"
                                  title={lang === 'tr' ? 'Görseli Kaldır' : 'Remove Image'}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                              {image === mainImage && (
                                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs py-1 px-2 rounded">
                                  {lang === 'tr' ? 'Ana' : 'Main'}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="col-span-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <p className="text-gray-500 mb-4">
                          {lang === 'tr' ? 'Galeriye henüz görsel yüklenmedi.' : 'No images in gallery yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <FaUpload className="mr-2" />
                          {lang === 'tr' ? 'Görsel Yükle' : 'Upload Image'}
                        </button>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-md flex items-center"
            >
              <FaSave className="mr-2" />
              {isSaving 
                ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                : (lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 