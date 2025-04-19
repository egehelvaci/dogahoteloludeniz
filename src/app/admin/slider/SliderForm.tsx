'use client';

import React, { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import SliderUploader from '@/components/admin/sliders/SliderUploader';
import { Card, CardContent } from '@/components/ui/card';

// Form şeması
const formSchema = z.object({
  title: z.string().min(2, 'Başlık en az 2 karakter olmalıdır'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1, 'Görsel URL\'si gereklidir'),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface SliderFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting?: boolean;
}

const SliderForm: React.FC<SliderFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting = false,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(isSubmitting);
  
  // Varsayılan değerler
  const defaultValues: Partial<FormData> = {
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    buttonUrl: '',
    order: 0,
    isActive: true,
    ...initialData,
  };
  
  // Form oluştur
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Form gönderimi
  const handleSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      await onSubmit(data);
      
      toast({
        title: 'Başarılı',
        description: initialData?.id 
          ? 'Slider başarıyla güncellendi' 
          : 'Slider başarıyla oluşturuldu',
      });
    } catch (error) {
      console.error('Form gönderim hatası:', error);
      toast({
        title: 'Hata',
        description: 'Slider kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sol Bölüm - Form Alanları */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Başlık" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Alt Başlık" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Slider açıklaması" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buton Metni</FormLabel>
                    <FormControl>
                      <Input placeholder="Daha Fazla" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buttonUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buton URL</FormLabel>
                    <FormControl>
                      <Input placeholder="/hakkimizda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sıralama</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktif</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Sağ Bölüm - Görsel Yükleme */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-base font-medium mb-4">Slider Görseli</h3>
                <SliderUploader 
                  bgImageUrl={form.getValues().imageUrl}
                  onUploadComplete={(imageUrl) => {
                    form.setValue('imageUrl', imageUrl, { shouldValidate: true });
                  }} 
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Form Düğmeleri */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Sıfırla
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Kaydediliyor...' : initialData?.id ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SliderForm; 