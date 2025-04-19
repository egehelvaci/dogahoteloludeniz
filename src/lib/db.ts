import { Pool } from 'pg';

// PostgreSQL bağlantı havuzu oluştur
let pool: Pool | undefined;

// Eğer havuz yoksa oluştur - şimdi dışa aktarıldı
export function getPool(): Pool {
  if (!pool) {
    console.log('Veritabanı havuzu oluşturuluyor');
    
    // Bağlantı URL'sini log'a yazalım (hassas bilgiler gizlenerek)
    const databaseUrl = process.env.DATABASE_URL || '';
    console.log('DB URL:', databaseUrl ? 'Mevcut ✓' : 'Eksik ✗');
    if (databaseUrl) {
      const prefix = databaseUrl.substring(0, 15);
      console.log('DB URL prefix:', prefix + '...');
    } else {
      console.error('DB URL eksik, bağlantı kurulamayacak!');
    }
    
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 20, // Havuzdaki maksimum bağlantı sayısı
        idleTimeoutMillis: 30000, // Boşta bağlantıların timeout süresi (30 saniye)
        connectionTimeoutMillis: 10000, // Bağlantı kurma timeout süresi (10 saniye)
      });
      
      // Havuzu test et
      pool.on('error', (err) => {
        console.error('PostgreSQL havuzu hatası:', err);
        pool = undefined; // Havuzu sıfırla
      });
      
      pool.on('connect', () => {
        console.log('PostgreSQL bağlantısı kuruldu');
      });
      
      // İlk bağlantıyı kurmayı dene (havuzu ısıt)
      pool.query('SELECT 1')
        .then(() => console.log('Veritabanı bağlantısı test edildi, başarılı'))
        .catch(err => console.error('Veritabanı test bağlantısı başarısız:', err));
      
    } catch (error) {
      console.error('Veritabanı havuzu oluşturulamadı:', error);
      throw new Error(`Veritabanı havuzu oluşturma hatası: ${error.message}`);
    }
  }
  
  return pool;
}

// Transaction başlatma fonksiyonu
export async function beginTransaction(): Promise<any> {
  console.log('[DB] Transaction başlatılıyor...');
  
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    console.log('[DB] Transaction başarıyla başlatıldı');
    
    // Client'a query ve transaction metodları ekle
    const extendedClient = {
      query: client.query.bind(client),
      release: client.release.bind(client),
      commit: async () => {
        try {
          await client.query('COMMIT');
          console.log('[DB] Transaction başarıyla commit edildi');
        } finally {
          client.release();
        }
      },
      rollback: async () => {
        try {
          await client.query('ROLLBACK');
          console.log('[DB] Transaction geri alındı (rollback)');
        } finally {
          client.release();
        }
      }
    };
    
    return {
      client: extendedClient,
      rows: [],
      rowCount: 0
    };
  } catch (error) {
    client.release();
    console.error('[DB] Transaction başlatma hatası:', error);
    throw new Error(`Veritabanı transaction başlatılamadı: ${error.message}`);
  }
}

// SQL sorgusu çalıştırma
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  console.log('[DB] SQL Sorgusu Başlatılıyor:', query.slice(0, 100) + '...');
  console.log('[DB] Parametreler:', JSON.stringify(params));
  
  // Transaction başlatılması kontrolü
  if (query.trim().toUpperCase() === 'BEGIN') {
    return beginTransaction();
  }
  
  let client;
  try {
    const pool = getPool();
    client = await pool.connect();
    console.log('[DB] Veritabanı bağlantısı başarılı');
    
    const result = await client.query(query, params);
    console.log('[DB] Sorgu başarılı, satır sayısı:', result.rowCount);
    
    // Client'ı sonuçta döndür (transaction için gerekli)
    result.client = client;
    
    return result;
  } catch (error) {
    console.error('[DB] Veritabanı hatası:', error);
    console.error('[DB] Hata detayları:', JSON.stringify({
      message: error.message,
      code: error.code,
      detail: error.detail
    }, null, 2));
    
    if (error.code) {
      console.error(`[DB] PostgreSQL hata kodu: ${error.code}`);
    }
    
    throw error;
  } finally {
    // Client sadece bu sonuca özel bir transaction değilse serbest bırak
    if (client && query.trim().toUpperCase() !== 'BEGIN') {
      console.log('[DB] Bağlantı kapatıldı');
      client.release();
    }
  }
}

// Bağlantıyı kapat (server shutdown sırasında çağrılabilir)
export async function closePool() {
  if (pool) {
    console.log('Veritabanı havuzu kapatılıyor');
    await pool.end();
    pool = undefined;
  }
} 