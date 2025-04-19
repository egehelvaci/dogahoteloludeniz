'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { BiLoader } from 'react-icons/bi';
import AdminHeader from '../../../../components/admin/AdminHeader';
import { addSlider } from '../../../../data/admin/sliderData';
import MediaUploader from '../../../../../components/ui/MediaUploader';
import ImageKitImage from '../../../../../components/ui/ImageKitImage';
import ImageKitVideo from '../../../../../components/ui/ImageKitVideo';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Corrected AddSliderPageProps interface
interface AddSliderPageProps {
  params: {
    lang: string;
  };
}

export default function AddSliderPage({ params }: AddSliderPageProps) {
  // React.use kullanarak params değerine eriş
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang || 'tr';

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
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

  const { t } = useTranslation();

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
    
    try {
      console.log('Slider form verileri:', formData);
      
      // Form doğrulama kontrolleri
      if (!formData.titleTR?.trim() || !formData.titleEN?.trim()) {
        throw new Error('Türkçe ve İngilizce başlık alanları zorunludur');
      }
      
      if (!formData.image && !formData.videoUrl) {
        throw new Error('Bir görsel yüklenmeli veya video URL\'si girilmelidir');
      }
      
      const sliderData: Partial<SliderItem> = {
        titleTR: formData.titleTR,
        titleEN: formData.titleEN,
        descriptionTR: formData.descriptionTR || '',
        descriptionEN: formData.descriptionEN || '',
        buttonTextTR: formData.buttonTextTR || '',
        buttonTextEN: formData.buttonTextEN || '',
        buttonLink: formData.buttonLink || '',
        image: formData.image || '',
        videoUrl: formData.videoUrl || '',
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
      };
      
      console.log('API\'ye gönderilecek veri:', sliderData);
      
      const result = await addSlider(sliderData);
      
      if (!result) {
        throw new Error('Slider eklenirken bir hata oluştu, API boş yanıt döndürdü');
      }
      
      console.log('Slider başarıyla eklendi:', result);
      
      // Bildirim gösterme ve formu sıfırlama
      toast.success(t('sliderAddedSuccessfully') || 'Slider başarıyla eklendi');
      reset();
      
      // Dashboard'a yönlendirme
      setTimeout(() => {
        router.push(`/${lang}/admin/hero-slider`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Slider ekleme hatası:', error);
      
      let errorMessage = 'Slider eklenirken bir hata oluştu';
      
      // Hata tipine göre özel mesajlar
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
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
    
    try {
      // Yüklenen medya türüne göre state'i güncelle
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
    } catch (err) {
      console.error('Medya state güncelleme hatası:', err);
      setError('Medya bilgisi formda güncellenirken hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Yeni Slider Ekle" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <Link
            href={`/${lang}/admin/hero-slider`}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <FaArrowLeft className="mr-2" /> Geri Dön
          </Link>
          <h1 className="text-2xl font-bold">Yeni Slider Ekle</h1>
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
                    {formData.image ? 'Görsel' : 'Video'} başarıyla yüklendi
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
                    Ekleniyor...
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
    </div>
  );
}
