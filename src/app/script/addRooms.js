// Oda verilerini veritabanına eklemek için script
// Bu script, fetch API kullanarak odaları ekler

// Tüm odalar için ortak resim URL'si
const sharedImageUrl = "https://s3.tebi.io/dogahotelfethiye/rooms/43c7e499-ba30-40a9-a010-79902cd38558/23197252-a34c-475f-8875-27ce32b5e1a6.jpg";

// Oda verileri
const rooms = [
  {
    id: "standard-room-001",
    nameTR: "Standart Oda",
    nameEN: "Standard Room",
    descriptionTR: "26 m2 olup, çift kişilik yatak mevcuttur. Odalarda; konforlu bir konaklama için ihtiyacınız olan tüm olanaklar bulunmaktadır.",
    descriptionEN: "26 m² with a double bed. The rooms include all the amenities you need for a comfortable stay.",
    image: sharedImageUrl,
    mainImageUrl: sharedImageUrl,
    priceTR: "1.500 ₺",
    priceEN: "€50",
    capacity: 2,
    size: 26,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "standard",
    active: true,
    order: 1
  },
  {
    id: "triple-room-001",
    nameTR: "Triple Oda",
    nameEN: "Triple Room",
    descriptionTR: "26 m2 olup, Odalarda 1 adet çift kişilik 1 adet tek kişilik yatak mevcuttur. Aile ve arkadaş grupları için ideal konaklama seçeneği.",
    descriptionEN: "26 m² with one double bed and one single bed. An ideal accommodation option for families and groups of friends.",
    image: sharedImageUrl,
    mainImageUrl: sharedImageUrl,
    priceTR: "2.000 ₺",
    priceEN: "€70",
    capacity: 3,
    size: 26,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "triple",
    active: true,
    order: 2
  },
  {
    id: "suite-room-001",
    nameTR: "Suite Oda",
    nameEN: "Suite Room",
    descriptionTR: "40 m2 olup, 1 adet çift kişilik Yatak ve 3 adet tek kişilik yatak mevcuttur. Tek duşlu olup seramik zeminden oluşmaktadır. Geniş aileler için ideal.",
    descriptionEN: "40 m² with one double bed and three single beds. It has a single shower and ceramic flooring. Ideal for large families.",
    image: sharedImageUrl,
    mainImageUrl: sharedImageUrl,
    priceTR: "3.000 ₺",
    priceEN: "€100",
    capacity: 5,
    size: 40,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "LCD TV",
      "Mini-Bar",
      "WC & Duşa Kabin",
      "Balkon",
      "Güvenlik Kasası",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "LCD TV",
      "Mini-Bar",
      "WC & Shower Cabin",
      "Balcony",
      "Safe Box",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "suite",
    active: true,
    order: 3
  },
  {
    id: "apart-room-001",
    nameTR: "Apart Oda",
    nameEN: "Apart Room",
    descriptionTR: "30 m2 olup, tek duşlu olup seramik zeminden oluşmaktadır. Uzun süreli konaklamalar için ideal.",
    descriptionEN: "30 m² with a single shower and ceramic flooring. Ideal for long-term stays.",
    image: sharedImageUrl,
    mainImageUrl: sharedImageUrl,
    priceTR: "2.500 ₺",
    priceEN: "€80",
    capacity: 2,
    size: 30,
    featuresTR: [
      "Klima",
      "Saç Kurutma Makinası",
      "Uydu TV",
      "WC & Duşa Kabin",
      "Balkon",
      "Dağ yada Havuz Manzarası"
    ],
    featuresEN: [
      "Air Conditioning",
      "Hair Dryer",
      "Satellite TV",
      "WC & Shower Cabin",
      "Balcony",
      "Mountain or Pool View"
    ],
    gallery: [sharedImageUrl, sharedImageUrl, sharedImageUrl],
    type: "apart",
    active: true,
    order: 4
  }
];

/**
 * Odaları ekle
 */
async function addRooms() {
  try {
    console.log("Odaları ekleme işlemi başlatılıyor...");
    
    for (const room of rooms) {
      console.log(`Ekleniyor: ${room.nameTR} / ${room.nameEN}`);
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(room)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Başarıyla eklendi: ${room.nameTR} (ID: ${data.data.id})`);
      } else {
        console.error(`❌ Eklenirken hata: ${room.nameTR} - ${data.message}`);
      }
    }
    
    console.log("Tüm oda ekleme işlemleri tamamlandı!");
  } catch (error) {
    console.error("Oda ekleme hatası:", error);
  }
}

// Script çalıştırma fonksiyonu
function runScript() {
  addRooms()
    .then(() => {
      console.log("Script başarıyla tamamlandı!");
    })
    .catch(error => {
      console.error("Script çalıştırılırken hata:", error);
    });
}

// Script'i çalıştır
runScript(); 