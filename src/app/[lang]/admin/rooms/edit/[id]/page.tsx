'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaUpload, FaTimes, FaTrash, FaStar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getRoomById, updateRoomItem, toggleRoomVisibility } from '../../../../../data/admin/roomsData';
import { getAllRoomTypes } from '../../../../../data/admin/roomTypesData';
import { RoomType } from '@prisma/client';

interface AdminEditRoomPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function AdminEditRoomPage({ params }: AdminEditRoomPageProps) {
  const routeParams = useParams();
  const lang = routeParams.lang as string;
  const id = routeParams.id as string;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [featuresTR, setFeaturesTR] = useState<string[]>(['']);
  const [featuresEN, setFeaturesEN] = useState<string[]>(['']);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  const [roomData, setRoomData] = useState({
    nameTR: '',
    nameEN: '',
    descriptionTR: '',
    descriptionEN: '',
    image: '',
    capacity: 2,
    size: 25,
    type: 'standard',
    roomTypeId: '',
    active: true,
    order: 1,
    gallery: [] as string[]
  });

  // Oda türlerini yükle
  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        const types = await getAllRoomTypes();
        if (types && types.length > 0) {
          setRoomTypes(types);
        }
      } catch (error) {
        console.error('Oda tipleri yüklenirken hata:', error);
      }
    };
    
    loadRoomTypes();
  }, []);

  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const roomItem = await getRoomById(id);
        
        if (roomItem) {
          // Ana görsel için galeri içindeki indeksi bul
          const mainImage = roomItem.mainImageUrl || roomItem.image || '';
          const mainIndex = roomItem.gallery?.findIndex(img => img === mainImage) || 0;
          
          setRoomData({
            nameTR: roomItem.nameTR,
            nameEN: roomItem.nameEN,
            descriptionTR: roomItem.descriptionTR,
            descriptionEN: roomItem.descriptionEN,
            image: mainImage,
            capacity: roomItem.capacity,
            size: roomItem.size,
            type: roomItem.type,
            roomTypeId: roomItem.roomTypeId || '',
            active: roomItem.active,
            order: roomItem.orderNumber,
            gallery: roomItem.gallery || []
          });
          
          setMainImageIndex(mainIndex >= 0 ? mainIndex : 0);
          setFeaturesTR(roomItem.featuresTR || []);
          setFeaturesEN(roomItem.featuresEN || []);
        } else {
          toast.error(lang === 'tr' ? 'Oda bulunamadı!' : 'Room not found!');
          router.push(`/${lang}/admin/rooms`);
        }
      } catch (error) {
        console.error('Oda yüklenirken hata:', error);
        toast.error(lang === 'tr' ? 'Oda bilgileri yüklenirken bir hata oluştu!' : 'An error occurred while loading room data!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoomData();
  }, [id, lang, router]);

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'capacity' || name === 'size') {
      setRoomData({ ...roomData, [name]: Number(value) });
    } else {
      setRoomData({ ...roomData, [name]: value });
    }
  };

  // Özellik ekle/çıkar/değiştir
  const handleFeatureChange = (index: number, value: string, lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      const newFeatures = [...featuresTR];
      newFeatures[index] = value;
      setFeaturesTR(newFeatures);
    } else {
      const newFeatures = [...featuresEN];
      newFeatures[index] = value;
      setFeaturesEN(newFeatures);
    }
  };

  const addFeature = (lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      setFeaturesTR([...featuresTR, '']);
    } else {
      setFeaturesEN([...featuresEN, '']);
    }
  };

  const removeFeature = (index: number, lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      const newFeatures = [...featuresTR];
      newFeatures.splice(index, 1);
      setFeaturesTR(newFeatures);
    } else {
      const newFeatures = [...featuresEN];
      newFeatures.splice(index, 1);
      setFeaturesEN(newFeatures);
    }
  };

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      console.log('Dosya yükleniyor:', file.name, file.type, file.size);
      
      // Form verisi oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', id); // Oda ID'sini ekle
      
      // Tebi.io'ya doğrudan yükle
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Yükleme API yanıtı başarısız:', response.status);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Dosya yüklenemedi');
      }

      const result = await response.json();
      console.log('Yükleme sonucu:', result);

      if (result.success && result.url) {
        // Yeni görseli galeri listesine ekle
        const updatedGallery = [...roomData.gallery, result.url];
        setRoomData({ 
          ...roomData, 
          gallery: updatedGallery,
          // İlk resim eklendiyse, otomatik olarak ana görsel olsun
          image: roomData.gallery.length === 0 ? result.url : roomData.image
        });
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

  // Görseli galeriden kaldır
  const removeImage = (index: number) => {
    const newGallery = [...roomData.gallery];
    newGallery.splice(index, 1);
    
    // Eğer silinen ana görselse, ilk görseli ana görsel yap
    let newMainImage = roomData.image;
    let newMainIndex = mainImageIndex;
    
    if (index === mainImageIndex) {
      newMainImage = newGallery.length > 0 ? newGallery[0] : '';
      newMainIndex = 0;
    } else if (index < mainImageIndex) {
      // Ana görselin indeksi değişir
      newMainIndex = mainImageIndex - 1;
    }
    
    setRoomData({
      ...roomData,
      gallery: newGallery,
      image: newMainImage
    });
    setMainImageIndex(newMainIndex);
  };

  // Ana görseli değiştir
  const setAsMainImage = (index: number) => {
    if (index >= 0 && index < roomData.gallery.length) {
      setRoomData({
        ...roomData,
        image: roomData.gallery[index]
      });
      setMainImageIndex(index);
      toast.success(lang === 'tr' ? 'Ana görsel değiştirildi!' : 'Main image changed!');
    }
  };

  // Oda güncelle
  const handleSaveRoom = async () => {
    // Form validation
    if (!roomData.nameTR || !roomData.nameEN || !roomData.descriptionTR || !roomData.descriptionEN) {
      toast.error(lang === 'tr' ? 'Lütfen gerekli alanları doldurun.' : 'Please fill in the required fields.');
      return;
    }

    // En az bir görsel olmalı
    if (roomData.gallery.length === 0) {
      toast.error(lang === 'tr' ? 'Lütfen en az bir görsel ekleyin.' : 'Please add at least one image.');
      return;
    }

    // Boş özellikleri temizle
    const cleanFeaturesTR = featuresTR.filter(f => f.trim() !== '');
    const cleanFeaturesEN = featuresEN.filter(f => f.trim() !== '');

    setIsSaving(true);

    try {
      // Orijinal oda verilerini al
      const originalRoom = await getRoomById(id);
      
      // Oda nesnesini oluştur
      const updatedRoom = {
        nameTR: roomData.nameTR,
        nameEN: roomData.nameEN,
        descriptionTR: roomData.descriptionTR,
        descriptionEN: roomData.descriptionEN,
        image: roomData.image, 
        mainImageUrl: roomData.image,
        priceTR: originalRoom?.priceTR || '',
        priceEN: originalRoom?.priceEN || '',
        capacity: roomData.capacity,
        size: roomData.size,
        // Özellik dizileri - boş denetimi yapılmış temiz diziler
        featuresTR: cleanFeaturesTR,
        featuresEN: cleanFeaturesEN,
        type: roomData.type,
        roomTypeId: roomData.roomTypeId || null,
        active: roomData.active,
        order: roomData.order,
        orderNumber: roomData.order,
        gallery: roomData.gallery
      };
      
      console.log('Güncellenecek oda:', id);
      
      // Direkt fetch ile API'ye istek yap
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRoom)
      });
      
      // Yanıtı işle
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(lang === 'tr' ? 'Oda başarıyla güncellendi!' : 'Room updated successfully!');
        router.push(`/${lang}/admin/rooms`);
      } else {
        console.error('Güncelleme hatası:', result);
        throw new Error(result.message || 'Oda güncellenemedi');
      }
    } catch (error) {
      console.error('Oda güncelleme hatası:', error);
      toast.error(lang === 'tr' ? 'Oda güncellenirken bir hata oluştu!' : 'An error occurred while updating the room!');
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
              {lang === 'tr' ? 'Odayı Düzenle' : 'Edit Room'}: {roomData.nameTR}
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href={`/${lang}/admin/rooms`}
                className="text-teal-600 hover:text-teal-700 flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                {lang === 'tr' ? 'Odalar Listesine Dön' : 'Back to Rooms List'}
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

          {/* Görsel Galerisi */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                {lang === 'tr' ? 'Oda Görselleri' : 'Room Images'}
              </h2>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                >
                  {isUploading ? (
                    <span>{lang === 'tr' ? 'Yükleniyor...' : 'Uploading...'}</span>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      <span>{lang === 'tr' ? 'Yeni Görsel Ekle' : 'Add New Image'}</span>
                    </>
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
            
            {/* Görsel Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {roomData.gallery.length > 0 ? (
                roomData.gallery.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 ${index === mainImageIndex ? 'border-yellow-500' : 'border-gray-200'}`}>
                      <img
                        src={image}
                        alt={`Oda görseli ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Görsel İşlem Butonları */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {index !== mainImageIndex && (
                        <button
                          type="button"
                          onClick={() => setAsMainImage(index)}
                          className="p-1 bg-yellow-500 text-white rounded"
                          title={lang === 'tr' ? 'Ana görsel yap' : 'Set as main image'}
                        >
                          <FaStar size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 bg-red-500 text-white rounded"
                        title={lang === 'tr' ? 'Görseli kaldır' : 'Remove image'}
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                    
                    {/* Ana Görsel İşareti */}
                    {index === mainImageIndex && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1" title={lang === 'tr' ? 'Ana görsel' : 'Main image'}>
                        <FaStar size={14} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-500 mb-4">
                    {lang === 'tr' ? 'Henüz hiç görsel yok.' : 'No images yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center"
                  >
                    <FaUpload className="mr-2" />
                    <span>{lang === 'tr' ? 'Görsel Ekle' : 'Add Image'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Oda Bilgileri Formu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sol Kolon - Temel Bilgiler */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {lang === 'tr' ? 'Temel Bilgiler' : 'Basic Information'}
              </h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameTR">
                  {lang === 'tr' ? 'Oda Adı (TR)' : 'Room Name (TR)'}
                </label>
                <input
                  id="nameTR"
                  type="text"
                  name="nameTR"
                  value={roomData.nameTR}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEN">
                  {lang === 'tr' ? 'Oda Adı (EN)' : 'Room Name (EN)'}
                </label>
                <input
                  id="nameEN"
                  type="text"
                  name="nameEN"
                  value={roomData.nameEN}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomTypeId">
                  {lang === 'tr' ? 'Oda Tipi' : 'Room Type'}
                </label>
                <select
                  id="roomTypeId"
                  name="roomTypeId"
                  value={roomData.roomTypeId}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">{lang === 'tr' ? 'Oda tipi seçin' : 'Select room type'}</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {lang === 'tr' ? type.nameTR : type.nameEN}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="capacity">
                    {lang === 'tr' ? 'Kapasite' : 'Capacity'}
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    min="1"
                    max="10"
                    value={roomData.capacity}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="size">
                    {lang === 'tr' ? 'Boyut (m²)' : 'Size (m²)'}
                  </label>
                  <input
                    id="size"
                    type="number"
                    name="size"
                    min="1"
                    max="200"
                    value={roomData.size}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="active">
                  {lang === 'tr' ? 'Durum' : 'Status'}
                </label>
                <div className="flex items-center">
                  <input
                    id="active"
                    type="checkbox"
                    name="active"
                    checked={roomData.active}
                    onChange={(e) => setRoomData({ ...roomData, active: e.target.checked })}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-gray-700">
                    {lang === 'tr' ? 'Aktif' : 'Active'}
                  </label>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        setIsSaving(true);
                        const success = await toggleRoomVisibility(id);
                        if (success) {
                          setRoomData({...roomData, active: !roomData.active});
                          toast.success(lang === 'tr' ? 'Görünürlük değiştirildi' : 'Visibility changed');
                        } else {
                          toast.error(lang === 'tr' ? 'Görünürlük değiştirilemedi' : 'Could not change visibility');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error(lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                  >
                    {lang === 'tr' ? 'Görünürlüğü Kaydet' : 'Save Visibility'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sağ Kolon - Açıklamalar */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {lang === 'tr' ? 'Açıklamalar' : 'Descriptions'}
              </h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descriptionTR">
                  {lang === 'tr' ? 'Açıklama (TR)' : 'Description (TR)'}
                </label>
                <textarea
                  id="descriptionTR"
                  name="descriptionTR"
                  value={roomData.descriptionTR}
                  onChange={handleInputChange}
                  rows={5}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descriptionEN">
                  {lang === 'tr' ? 'Açıklama (EN)' : 'Description (EN)'}
                </label>
                <textarea
                  id="descriptionEN"
                  name="descriptionEN"
                  value={roomData.descriptionEN}
                  onChange={handleInputChange}
                  rows={5}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Özellikler Bölümü */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {lang === 'tr' ? 'Oda Özellikleri' : 'Room Features'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Türkçe Özellikler */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 text-sm font-bold">
                    {lang === 'tr' ? 'Özellikler (TR)' : 'Features (TR)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => addFeature('TR')}
                    className="text-teal-600 hover:text-teal-700 text-sm"
                  >
                    {lang === 'tr' ? '+ Özellik Ekle' : '+ Add Feature'}
                  </button>
                </div>
                <div className="space-y-2">
                  {featuresTR.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value, 'TR')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder={lang === 'tr' ? 'Özellik girin' : 'Enter feature'}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index, 'TR')}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title={lang === 'tr' ? 'Kaldır' : 'Remove'}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* İngilizce Özellikler */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 text-sm font-bold">
                    {lang === 'tr' ? 'Özellikler (EN)' : 'Features (EN)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => addFeature('EN')}
                    className="text-teal-600 hover:text-teal-700 text-sm"
                  >
                    {lang === 'tr' ? '+ Özellik Ekle' : '+ Add Feature'}
                  </button>
                </div>
                <div className="space-y-2">
                  {featuresEN.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value, 'EN')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder={lang === 'tr' ? 'Özellik girin' : 'Enter feature'}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index, 'EN')}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title={lang === 'tr' ? 'Kaldır' : 'Remove'}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveRoom}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-md flex items-center font-semibold"
            >
              {isSaving ? (
                <span>{lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}</span>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 