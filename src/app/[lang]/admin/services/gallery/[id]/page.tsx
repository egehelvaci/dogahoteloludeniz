'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaUpload, FaTrash, FaImage, FaGripLines } from 'react-icons/fa';
import AdminNavbar from '../../../../../components/AdminNavbar';
import { getServiceById, updateServiceGallery } from '../../../../../data/admin/servicesData';

type PageProps = {
  params: {
    lang: string;
    id: string;
  };
};

export default function ServiceGalleryPage({ params }: PageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceName, setServiceName] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Hizmet verilerini yükle
  const fetchServiceData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/services/${id}?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(lang === 'tr' ? 'Servis verisi alınamadı' : 'Failed to fetch service data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || (lang === 'tr' ? 'Servis verisi alınamadı' : 'Failed to fetch service data'));
      }
      
      console.log("Alınan servis verisi:", data.item);
      
      // mainImageUrl değerini özellikle kontrol et
      if (data.item && data.item.mainImageUrl) {
        console.log("Ana görsel URL: ", data.item.mainImageUrl);
      } else {
        console.log("Ana görsel URL bulunamadı!");
      }
      
      // Servis adını state'e ata
      if (data.item) {
        setServiceName(lang === 'tr' ? data.item.titleTR : data.item.titleEN);
        
        // Galeri görsellerini images state'ine ata
        if (Array.isArray(data.item.gallery)) {
          setImages(data.item.gallery);
        } else {
          setImages([]);
        }
      }
    } catch (error) {
      console.error('Servis verisi getirilirken hata:', error);
      setMessage({
        text: lang === 'tr' 
          ? `Servis verisi yüklenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}` 
          : `Error loading service data: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yükleme
  useEffect(() => {
    // React.use sonrası id ve lang değerlerinin değişmeyeceğini biliyoruz, 
    // bu useEffect'i sadece bir kez çalıştır
    fetchServiceData();
    
    // Sayfa görünür olduğunda verileri yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServiceData();
      }
    };
    
    // Görünürlük değişikliklerini dinle (kullanıcı sekmeye geri döndüğünde)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Boş dependency array, sadece bir kez çalışacak

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    // Mevcut görselleri sakla
    const currentImages = [...images];
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append('file', file);
        
        console.log(`Dosya yükleniyor: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Servis galerisine özel upload endpoint'ini kullan
        const response = await fetch(`/api/admin/services/${id}/gallery/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Yükleme API yanıtı başarısız:', response.status, errorText);
          throw new Error(`Yükleme hatası: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(responseData.error || responseData.message || 'Dosya yüklenemedi');
        }
        
        // URL'yi al
        const imageUrl = responseData.url || responseData.filePath || '';
        
        if (!imageUrl) {
          throw new Error('Yükleme başarılı fakat resim URL bulunamadı');
        }
        
        console.log('Yüklenen dosya:', {
          url: imageUrl,
          galleryItem: responseData.galleryItem
        });
        
        // Yeni görsel yolunu ekle
        newImages.push(imageUrl);
      }
      
      // Yeni görselleri mevcut görsellerle birleştir
      setImages([...currentImages, ...newImages]);
      
      setMessage({
        text: lang === 'tr' ? 'Görsel(ler) başarıyla yüklendi' : 'Image(s) uploaded successfully',
        type: 'success'
      });
      
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Yükleme sonrası sayfa verilerini bir kez daha çek
      if (newImages.length > 0) {
        setTimeout(() => {
          fetchServiceData();
        }, 500);
      }
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      setMessage({
        text: error.message || 'Dosya yüklenirken bir hata oluştu',
        type: 'error'
      });
      
      // Hata durumunda, mevcut görsellere geri dön
      setImages(currentImages);
    } finally {
      setUploading(false);
    }
  };

  // Görseli kaldır
  const removeImage = (image: string) => {
    // Görseli listeden kaldır
    setImages(prev => prev.filter(img => img !== image));
    
    // Görselin başarıyla kaldırıldığını belirt
    setMessage({
      text: lang === 'tr' ? 'Görsel kaldırıldı (Kaydetmek için Değişiklikleri Kaydet butonuna tıklayın)' : 'Image removed (Click Save Changes to save)',
      type: 'success'
    });
  };

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    try {
      setUploading(true);
      setMessage(null);
      
      // Geçersiz URL'leri filtrele
      const validImages = images.filter(url => 
        url && typeof url === 'string' && url.trim() !== ''
      );
      
      if (validImages.length === 0) {
        setMessage({
          text: lang === 'tr' ? 'En az bir görsel olmalıdır' : 'At least one image is required',
          type: 'error'
        });
        setUploading(false);
        return;
      }
      
      // API'ye gönderilecek veri
      // İlk görsel (index 0) ana görsel olarak ayarlanır
      const mainImage = validImages[0];
      
      // Servis ID'sini temizle (olası boşlukları kaldır)
      const cleanId = id.trim();
      
      console.log('Galeri güncellemesi gönderiliyor:', {
        serviceId: cleanId,
        imageCount: validImages.length,
        mainImage: mainImage ? mainImage.slice(0, 30) + '...' : 'Yok' // Ana görsel URL'sinin başını logla
      });
      
      // HTTP isteğini gönder
      const timestamp = Date.now(); // Önbelleği engellemek için
      const requestUrl = `/api/admin/services/${cleanId}/gallery?t=${timestamp}`;
      console.log('İstek URL:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: validImages,
          image: mainImage // Ana görsel olarak ilk görseli belirtiyoruz
        }),
        next: { revalidate: 0 } // Server tarafında önbelleğe almayı engelle
      });

      // Yanıtın metin içeriğini önce alıp 
      const responseText = await response.text();
      console.log("API Yanıtı:", responseText);

      if (!response.ok) {
        console.error('Galeri güncelleme HTTP hatası:', response.status, response.statusText);
        
        try {
          // JSON formatında hata yanıtı olup olmadığını kontrol et
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || errorData.error || errorData.detail || 'Veritabanı güncellenirken bir hata oluştu');
        } catch (e) {
          // JSON değilse doğrudan metin olarak kullan
          throw new Error(`Güncelleme hatası: ${responseText || response.statusText}`);
        }
      }
      
      // Yanıt metnini JSON'a dönüştür
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('API yanıtı JSON formatında değil:', e);
        throw new Error('API yanıtı işlenemedi');
      }
      
      if (!result.success) {
        throw new Error(result.message || result.error || result.detail || 'Veritabanı güncellenirken bir hata oluştu');
      }
      
      console.log("Galeri API yanıtı:", result);
      
      setMessage({
        text: lang === 'tr' ? 'Değişiklikler kaydedildi' : 'Changes saved successfully',
        type: 'success'
      });
      
      // Veri güncelleme işlemi sonrası veriyi hemen yeniden yükleme
      setTimeout(() => {
        fetchServiceData();
      }, 500);
    } catch (error) {
      console.error('Galeri kaydetme hatası:', error);
      setMessage({
        text: lang === 'tr' 
          ? `Veritabanı güncellenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}` 
          : `Error updating database: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Manuel sürükle bırak işlemleri - daha kararlı çalışması için geliştirdim
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedItem];
    
    // Öğeyi kaldır ve yeni konuma ekle
    newImages.splice(draggedItem, 1);
    newImages.splice(index, 0, draggedImage);
    
    setImages(newImages);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    
    // Sıralama değiştiğinde kullanıcıya bilgi ver
    if (draggedItem !== null) {
      setMessage({
        text: lang === 'tr' 
          ? 'Görsel sırası değiştirildi (Kaydetmek için Değişiklikleri Kaydet butonuna tıklayın)' 
          : 'Image order changed (Click Save Changes to save)',
        type: 'success'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar lang={lang} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/${lang}/admin/services`)}
                className="mr-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === 'tr' ? `${serviceName} - Görsel Galerisi` : `${serviceName} - Image Gallery`}
              </h1>
            </div>
            
            <button
              onClick={saveChanges}
              disabled={uploading}
              className={`px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 flex items-center gap-2 ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  {lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
                </>
              ) : (
                <>
                  <FaImage />
                  {lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
          
          {message && (
            <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          {/* Dosya Yükleme Alanı */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {lang === 'tr' ? 'Görsel Yükle' : 'Upload Images'}
              </h2>
            </div>
            
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="mb-4 text-center">
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-700">
                  {lang === 'tr' ? 'Görselleri buraya sürükleyin veya' : 'Drag and drop your images here or'}
                </p>
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none">
                  <span>{lang === 'tr' ? 'dosya seçin' : 'browse files'}</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {lang === 'tr'
                  ? 'PNG, JPG, GIF veya WEBP formatları desteklenir. Maksimum dosya boyutu 5MB.'
                  : 'PNG, JPG, GIF or WEBP formats are supported. Maximum file size 5MB.'}
              </p>
            </div>
          </div>
          
          {/* Görsel Galerisi */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {lang === 'tr' ? 'Galeri Görselleri' : 'Gallery Images'}
              </h2>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {images.length} {lang === 'tr' ? 'görsel' : 'images'}
                </span>
                {images.length > 0 && (
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-md">
                    {lang === 'tr' ? 'İlk görsel ana görseldir' : 'First image is the main image'}
                  </div>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FaImage className="h-16 w-16 mb-4" />
                <p>{lang === 'tr' ? 'Henüz görsel yüklenmemiş' : 'No images uploaded yet'}</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  {lang === 'tr' 
                    ? 'Görselleri sıralamak için sürükleyip bırakabilirsiniz. En üstteki görsel ana görsel olarak kaydedilecek ve servis sayfasında ana görsel olarak kullanılacaktır.' 
                    : 'You can drag and drop images to reorder them. The topmost image will be saved as the main image and used as the main image on the service page.'}
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative group rounded-lg overflow-hidden border-2 cursor-move
                        ${index === 0 ? 'border-teal-400 ring-2 ring-teal-400' : 'border-gray-200'} 
                        ${draggedItem === index ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <div className="aspect-w-1 aspect-h-1 w-full">
                        <img
                          src={image}
                          alt={`${serviceName} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Kontrol Butonları */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          <div
                            className="p-2 rounded-full bg-white hover:bg-gray-200 transition-colors cursor-move"
                            title={lang === 'tr' ? 'Sürükle' : 'Drag to reorder'}
                          >
                            <FaGripLines className="text-gray-700" />
                          </div>
                          <button
                            onClick={() => removeImage(image)}
                            className="p-2 rounded-full bg-white hover:bg-red-500 hover:text-white transition-colors"
                            title={lang === 'tr' ? 'Görseli sil' : 'Remove image'}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      {/* Ana Görsel Etiketi */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow">
                          {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 