'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SliderForm from '@/app/admin/slider/SliderForm';
import { useToast } from '@/components/ui/use-toast';

const CreateSliderForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Gönderim için veri hazırla
      const sliderData = {
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        imageUrl: data.imageUrl,
        buttonText: data.buttonText || '',
        buttonUrl: data.buttonUrl || '',
        order: data.order || 0,
        isActive: data.isActive !== undefined ? data.isActive : true
      };
      
      // API'ye gönder
      const response = await fetch('/api/admin/slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sliderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Slider oluşturulurken bir hata oluştu');
      }
      
      // Başarılı yanıt
      toast({
        title: 'Başarılı',
        description: 'Yeni slider başarıyla oluşturuldu',
      });
      
      // Slider listesine yönlendir
      router.push('/admin/slider');
      router.refresh();
    } catch (error) {
      console.error('Slider oluşturma hatası:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Slider oluşturulurken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SliderForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default CreateSliderForm; 