// Resim yükleme fonksiyonu
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    setUploading(true);
    
    // Form verisi oluştur
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', id);
    
    // API'ye gönder
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      toast.error(`Yükleme başarısız: ${errorData.message || 'Bilinmeyen hata'}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Görsel başarıyla yüklendi');
      return data.url;
    } else {
      toast.error(`Yükleme hatası: ${data.message}`);
      return null;
    }
  } catch (error) {
    console.error('Yükleme hatası:', error);
    toast.error('Görsel yüklenirken bir hata oluştu');
    return null;
  } finally {
    setUploading(false);
  }
};

// Ana görsel yükleme işleyicisi
const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;
  
  const file = e.target.files[0];
  const imageUrl = await uploadImage(file);
  
  if (imageUrl) {
    // Form state'ini güncelle
    setFormData({
      ...formData,
      image: imageUrl,
      mainImageUrl: imageUrl
    });
  }
};

// Galeri görseli yükleme işleyicisi
const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;
  
  const file = e.target.files[0];
  const imageUrl = await uploadImage(file);
  
  if (imageUrl) {
    // Mevcut galeriye ekle
    setFormData({
      ...formData,
      gallery: [...formData.gallery, imageUrl]
    });
  }
}; 