'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEdit, FaTrashAlt, FaEye, FaPlus, FaGripVertical, FaArrowUp, FaArrowDown, FaSave, FaArrowLeft, FaGripLines, FaImage, FaVideo, FaTimes } from 'react-icons/fa';
import { BiLoader } from 'react-icons/bi';
import { toast } from 'react-hot-toast';
import { getAllSliderData, deleteSlider, reorderSliderItems, SliderItem } from '../../../data/admin/sliderData';
import ImageKitImage from '../../../../components/ui/ImageKitImage';
import ImageKitVideo from '../../../../components/ui/ImageKitVideo';
import Modal from '../../../../components/ui/Modal';
import AdminLayout from '../../../components/AdminLayout';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface HeroSliderPageProps {
  params: {
    lang: string;
  };
}

export default function HeroSliderPage({ params }: HeroSliderPageProps) {
  const resolvedParams = React.use(params as any) as { lang: string };
  const lang = resolvedParams.lang || 'tr';
  const router = useRouter();
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSliderItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllSliderData();
      console.log('Slider verileri alındı:', data.length);
      setSliderItems(data);
    } catch (err) {
      console.error('Slider verileri getirilirken hata:', err);
      setError(err instanceof Error ? err.message : 'Slider verileri alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSliderItems();
  }, [fetchSliderItems]);
  
  const handleDelete = async (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteSlider(itemToDelete);
      if (success) {
        setShowDeleteModal(false);
        setSuccess('Slider öğesi başarıyla silindi');
        setSliderItems(prevItems => prevItems.filter(item => item.id !== itemToDelete));
        toast.success('Slider öğesi silindi');
      } else {
        setError('Slider öğesi silinemedi');
        toast.error('Silme işlemi başarısız');
      }
    } catch (err) {
      console.error('Silme hatası:', err);
      setError('Slider öğesi silinirken bir hata oluştu');
      toast.error('Silme işlemi başarısız');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };
  
  const moveItemUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...sliderItems];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    setSliderItems(newItems);
  };
  
  const moveItemDown = (index: number) => {
    if (index >= sliderItems.length - 1) return;
    const newItems = [...sliderItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setSliderItems(newItems);
  };
  
  const saveOrder = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const itemsWithUpdatedOrder = sliderItems.map((item, index) => ({
        id: item.id,
        order: index + 1
      }));
      
      const result = await reorderSliderItems(itemsWithUpdatedOrder);
      setSuccess('Slider sıralaması başarıyla güncellendi');
      toast.success('Sıralama kaydedildi');
    } catch (err) {
      console.error('Sıralama kaydedilirken hata:', err);
      setError('Sıralama kaydedilemedi');
      toast.error('Sıralama kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hero Slider Yönetimi</h1>
          <div className="flex items-center gap-3">
            <Link 
              href={`/${lang}/admin/hero-slider/add`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaPlus className="mr-2" /> Yeni Ekle
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-md">
            {success}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <BiLoader className="animate-spin text-4xl text-blue-500" />
            <span className="ml-2 text-lg">Yükleniyor...</span>
          </div>
        ) : sliderItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg text-gray-500">Henüz slider öğesi eklenmemiş</p>
            <p className="mt-2 text-sm text-gray-400">Yeni bir slider eklemek için "Yeni Ekle" butonuna tıklayın</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-medium">Slider Öğeleri ({sliderItems.length})</h2>
                <button
                  onClick={saveOrder}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:bg-gray-400"
                >
                  {isSaving ? (
                    <>
                      <BiLoader className="animate-spin mr-2" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Sıralamayı Kaydet
                    </>
                  )}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sıra
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medya
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sliderItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{index + 1}</span>
                            <div className="ml-4 flex flex-col space-y-1">
                    <button 
                                onClick={() => moveItemUp(index)} 
                                disabled={index === 0}
                                className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="Yukarı Taşı"
                              >
                                <FaArrowUp size={14} />
                    </button>
                    <button 
                                onClick={() => moveItemDown(index)} 
                                disabled={index === sliderItems.length - 1}
                                className={`p-1 rounded ${index === sliderItems.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="Aşağı Taşı"
                              >
                                <FaArrowDown size={14} />
                    </button>
                  </div>
                </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-20 w-32 relative overflow-hidden">
                            {item.videoUrl ? (
                                <ImageKitVideo 
                                  src={item.videoUrl}
                                  className="h-20 w-32 object-cover rounded-md"
                                  width={128}
                                  height={80}
                                  controls={false}
                                  muted={true}
                                  loop={true}
                                  autoPlay={false}
                                />
                            ) : item.image ? (
                                <ImageKitImage
                                  src={item.image}
                                  alt={item.titleTR || 'Slider görseli'}
                                  className="h-20 w-32 object-cover rounded-md"
                                  width={128}
                                  height={80}
                                />
                            ) : (
                              <div className="h-20 w-32 flex items-center justify-center bg-gray-200 rounded-md">
                                <span className="text-xs text-gray-500">Görsel yok</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.titleTR}</div>
                          <div className="text-xs text-gray-500">{item.titleEN}</div>
                          {item.subtitleTR && (
                            <div className="text-xs text-gray-500 mt-1 italic">{item.subtitleTR}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link 
                                  href={`/${lang}/admin/hero-slider/edit/${item.id}`}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                                >
                              Düzenle
                                </Link>
                                <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                            >
                              Sil
                                </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                        </div>
                      </div>
            
            <div className="mt-6 flex justify-end">
              {/* Bu butonu kaldırıyorum çünkü yukarıda zaten aynı buton var */}
            </div>
          </>
          )}
        </div>
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Slider Öğesini Sil"
      >
        <div className="p-6">
          <p className="mb-4">Bu slider öğesini silmek istediğinizden emin misiniz?</p>
          <p className="mb-6 text-sm text-gray-500">Bu işlem geri alınamaz.</p>

            <div className="flex justify-end space-x-3">
              <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isDeleting}
              >
                İptal
              </button>
              <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <BiLoader className="animate-spin mr-2" />
                  Siliniyor...
                </>
              ) : (
                'Evet, Sil'
              )}
              </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
