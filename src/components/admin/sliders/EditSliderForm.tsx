'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SliderForm from '@/app/admin/slider/SliderForm';
import { useToast } from '@/components/ui/use-toast';

interface EditSliderFormProps {
  slider: any;
}

const EditSliderForm: React.FC<EditSliderFormProps> = ({ slider }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Gönderim için veri hazırla
      const sliderData = {
        id: slider.id,
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        imageUrl: data.imageUrl,
        buttonText: data.buttonText || '',
        buttonUrl: data.buttonUrl || '',
        order: data.order || 0,
        isActive: data.isActive
      };
      
      // API'ye gönder
      const response = await fetch('/api/admin/slider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sliderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Slider güncellenirken bir hata oluştu');
      }
      
      // Başarılı yanıt
      toast({
        title: 'Başarılı',
        description: 'Slider başarıyla güncellendi',
      });
      
      // Slider listesine yönlendir
      router.push('/admin/slider');
      router.refresh();
    } catch (error) {
      console.error('Slider güncelleme hatası:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Slider güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Formu başlatmak için veri hazırla
  const initialData = {
    id: slider.id,
    title: slider.title,
    subtitle: slider.subtitle || '',
    description: slider.description || '',
    imageUrl: slider.imageUrl || '',
    buttonText: slider.buttonText || '',
    buttonUrl: slider.buttonUrl || '',
    order: slider.order || 0,
    isActive: slider.isActive === undefined ? true : slider.isActive
  };
  
  return (
    <SliderForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default EditSliderForm; 