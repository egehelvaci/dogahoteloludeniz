'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaTrashAlt } from 'react-icons/fa';
import { BiLoader } from 'react-icons/bi';
import AdminHeader from '../../../../../components/admin/AdminHeader';
import { 
  getSliderById, 
  updateSlider, 
  deleteSlider, 
  getAllSliderData, 
  SliderItem 
} from '../../../../../data/admin/sliderData';
import MediaUploader from '../../../../../../components/ui/MediaUploader';
import ImageKitImage from '../../../../../../components/ui/ImageKitImage';
import ImageKitVideo from '../../../../../../components/ui/ImageKitVideo';
import { toast } from 'react-hot-toast';

// Corrected EditSliderPageProps interface
interface EditSliderPageProps {
  params: {
    lang: string;
    id: string;
  };
}

// Axios hatası için yardımcı tip tanımı
interface AxiosError extends Error {
  response?: {
    data: any;
    status: number;
  };
}

export default function EditSliderPage({ params }: EditSliderPageProps) {
  // React.use() kullanmadan önce params değerini çöz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang || 'tr';
  const id = resolvedParams.id;

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sliderItem, setSliderItem] = useState<SliderItem | null>(null);
  const [formData, setFormData] = useState<Partial<SliderItem>>({
    image: '',
    videoUrl: '',
    titleTR: '',
    titleEN: '',
    subtitleTR: '',
    subtitleEN: '',
    descriptionTR: '',
    descriptionEN: '',
    active: true
  });

  // Medya türünü dosya uzantısına göre belirle
  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    
    // URL'den dosya türünü tespit et
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    
    // Diğer ipuçlarını kontrol et
    const hasVideoPath = url.toLowerCase().includes('/videos/') || url.toLowerCase().includes('/video/');
    const hasVideoQuery = url.toLowerCase().includes('video=') || url.toLowerCase().includes('type=video');
    
    // Tebi'nin dosya URL'si içindeki belirli desenleri kontrol et
    const isTebiVideoUrl = url.includes('s3.tebi.io') && 
                          (url.includes('video') || url.includes('mov') || url.includes('mp4'));
    
    return hasVideoExtension || hasVideoPath || hasVideoQuery || isTebiVideoUrl;
  };

  // Slider verisini yükle
  useEffect(() => {
    const fetchSliderItem = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Tüm verileri getir
        const allItems = await getAllSliderData();
        
        // ID'ye göre filtrele
        const item = allItems.find((item) => item.id === id);
        
        if (!item) {
          setError('Slider bulunamadı.');
          return;
        }

        setSliderItem(item);
        // Tipleri uyumlu hale getir ve null değerleri boş string yap
        setFormData({
          ...item,
          videoUrl: item.videoUrl || '',
          subtitleTR: item.subtitleTR || '',
          subtitleEN: item.subtitleEN || '',
          descriptionTR: item.descriptionTR || '',
          descriptionEN: item.descriptionEN || '',
          // title alanlari required olduğu için boş string olmamalı
          titleTR: item.titleTR || '',
          titleEN: item.titleEN || '',
          image: item.image || ''
        });
      } catch (err: unknown) {
        console.error('Slider verisi alınırken hata:', err);
        let errorMessage = 'Bilinmeyen hata';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(`Hata: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSliderItem();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validasyon
    if (!formData.image && !formData.videoUrl) {
      setError('Lütfen en az bir görsel veya video yükleyin');
      setIsSubmitting(false);
      return;
    }

    if (!formData.titleTR || !formData.titleEN) {
      setError('Lütfen Türkçe ve İngilizce başlık alanlarını doldurun');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Slider güncelleme başlatılıyor. ID:', id, 'Veriler:', formData);
      
      const updateData = {
        image: formData.image || '',
        videoUrl: formData.videoUrl || '',
        titleTR: formData.titleTR || '',
        titleEN: formData.titleEN || '',
        subtitleTR: formData.subtitleTR || '',
        subtitleEN: formData.subtitleEN || '',
        descriptionTR: formData.descriptionTR || '',
        descriptionEN: formData.descriptionEN || '',
        active: formData.active === undefined ? true : formData.active
      };
      
      // Önce mevcut veriyi al, değişen alanları bul ve sadece onları gönder
      if (sliderItem) {
        const changedFields = Object.entries(updateData).reduce((acc: Record<string, any>, [key, value]) => {
          // sliderItem'in bu özellikleri var, null ve undefined kontrolü yapalım
          const itemValue = (sliderItem as any)[key];
          
          // String değerler için "null" ve "undefined" kontrolü
          if (typeof value === 'string' && (itemValue === null || itemValue === undefined)) {
            // sliderItem'de null/undefined ise ve yeni değer boş string değilse
            if (value !== '') {
              acc[key] = value;
            }
          } 
          // Boolean değerler için doğrudan karşılaştır
          else if (typeof value === 'boolean' && itemValue !== value) {
            acc[key] = value;
          }
          // Diğer durumlarda eşit değilse ekle
          else if (itemValue !== value) {
            acc[key] = value;
          }
          
          return acc;
        }, {});
        
        console.log('Değişen alanlar:', changedFields);
        
        if (Object.keys(changedFields).length === 0) {
          console.log('Değişiklik yok, güncelleme yapılmayacak');
          router.push(`/${lang}/admin/hero-slider`);
          return;
        }
        
        const result = await updateSlider(id, changedFields);
        console.log('Slider güncelleme başarılı, sonuç:', result);
        
        if (result) {
          router.push(`/${lang}/admin/hero-slider`);
        } else {
          setError('Slider öğesi güncellenirken bir hata oluştu.');
        }
      } else {
        // sliderItem null ise tüm alanları gönder
        const result = await updateSlider(id, updateData);
        
        if (result) {
          console.log('Slider güncelleme başarılı, sonuç:', result);
          router.push(`/${lang}/admin/hero-slider`);
        } else {
          setError('Slider öğesi güncellenirken bir hata oluştu.');
        }
      }
    } catch (err: unknown) {
      console.error('Slider güncelleme hatası:', err);
      
      let errorMessage = 'Bilinmeyen hata';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Axios hata yanıtını kontrol et
        const axiosErr = err as AxiosError;
        if (axiosErr.response && axiosErr.response.data) {
          const responseData = axiosErr.response.data;
          
          if (responseData.error) {
            errorMessage = responseData.error;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
          
          // HTTP durum kodunu logla
          console.error('HTTP durum kodu:', axiosErr.response.status);
        }
      }
      
      setError(`Hata: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    setIsSubmitting(true);
    
    try {
      const success = await deleteSlider(id);
      
      if (success) {
        router.push(`/${lang}/admin/hero-slider`);
      } else {
        setError('Slider silinirken bir hata oluştu.');
        setShowDeleteConfirm(false);
      }
    } catch (err: unknown) {
      console.error('Silme hatası:', err);
      let errorMessage = 'Bilinmeyen hata';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Hata: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Görsel yükleme işlemi tamamlandığında çağrılacak fonksiyon
  const handleMediaUploaded = (result: {url: string, fileId: string, fileType: string}) => {
    if (!result.url) {
      setError('Dosya yükleme başarısız oldu. Lütfen tekrar deneyin.');
      return;
    }
    
    console.log('Medya yükleme sonucu:', result);
    
    // Dosya türünü belirle
    const isVideo = result.fileType === 'video' || isVideoFile(result.url);
    console.log(`Medya türü: ${isVideo ? 'Video' : 'Görsel'}, URL: ${result.url}`);
    
    if (isVideo) {
      console.log("Video dosyası algılandı, formData güncelleniyor...");
      // Video yüklendiyse videoUrl alanını güncelle, image'ı temizle
      setFormData({
        ...formData,
        videoUrl: result.url,
        image: '' // Görsel alanını temizle
      });
    } else {
      console.log("Görsel dosyası algılandı, formData güncelleniyor...");
      // Görsel yüklendiyse image alanını güncelle, videoUrl'ı temizle
      setFormData({
        ...formData,
        image: result.url,
        videoUrl: '' // Video alanını temizle
      });
    }
    
    // Başarı mesajı göster
    toast.success(`${isVideo ? 'Video' : 'Görsel'} başarıyla yüklendi!`);
    
    console.log('Form durumu güncellendi:', {
      ...formData,
      videoUrl: isVideo ? result.url : '',
      image: !isVideo ? result.url : ''
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader title="Slider Düzenle" />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="flex items-center">
            <BiLoader className="animate-spin text-3xl text-blue-600 mr-2" />
            <span>Slider verisi yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Slider Düzenle" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/${lang}/admin/hero-slider`}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <FaArrowLeft className="mr-2" /> Geri Dön
            </Link>
            <h1 className="text-2xl font-bold">Slider Düzenle</h1>
          </div>
          
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <FaTrashAlt className="mr-2" />
            Sil
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Medya (Görsel veya Video)</label>
              <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <MediaUploader 
                  onUpload={(result) => {
                    console.log('MediaUploader sonucu:', result);
                    handleMediaUploaded(result);
                  }}
                  type="any"
                  folder="slider"
                  label="Görsel veya Video Yükle"
                  maxSizeMB={10}
                  apiEndpoint="/api/upload"
                  initialUrl={formData.image || formData.videoUrl}
                />
                
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  Slider için bir görsel veya video yükleyin. Görsel için JPG/PNG, video için MP4 formatı önerilir.
                </p>
                
                {!formData.image && !formData.videoUrl && (
                  <p className="text-amber-600 text-sm mt-2">Bir görsel veya video eklemelisiniz</p>
                )}
                
                {(formData.image || formData.videoUrl) && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md text-sm flex items-center">
                    <span className="mr-2">✓</span>
                    {formData.image ? 'Görsel' : 'Video'} yüklendi
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Başlık (Türkçe)*</label>
                <input
                  type="text"
                  name="titleTR"
                  value={formData.titleTR}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Başlık (İngilizce)*</label>
                <input
                  type="text"
                  name="titleEN"
                  value={formData.titleEN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Alt Başlık (Türkçe)</label>
                <input
                  type="text"
                  name="subtitleTR"
                  value={formData.subtitleTR}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Alt Başlık (İngilizce)</label>
                <input
                  type="text"
                  name="subtitleEN"
                  value={formData.subtitleEN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Açıklama (Türkçe)</label>
                <textarea
                  name="descriptionTR"
                  value={formData.descriptionTR}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Açıklama (İngilizce)</label>
                <textarea
                  name="descriptionEN"
                  value={formData.descriptionEN}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="mr-2 h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Aktif</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Bu seçeneği işaretlerseniz, slider ana sayfada görüntülenir.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <BiLoader className="animate-spin mr-2" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Silme onay modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4 w-full">
            <h3 className="text-xl font-bold mb-4">Slider'ı Sil</h3>
            <p className="mb-6 text-gray-600">
              Bu slider'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <BiLoader className="animate-spin mr-2" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <FaTrashAlt className="mr-2" />
                    Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
