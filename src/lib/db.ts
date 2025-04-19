import { Pool } from 'pg';

// PostgreSQL bağlantı havuzu oluştur
let pool: Pool | undefined;

// Eğer havuz yoksa oluştur
function getPool(): Pool {
  if (!pool) {
    console.log('Veritabanı havuzu oluşturuluyor');
    
    // Bağlantı URL'sini log'a yazalım (hassas bilgiler gizlenerek)
    const databaseUrl = process.env.DATABASE_URL || '';
    console.log('DB URL:', databaseUrl ? 'Mevcut ✓' : 'Eksik ✗');
    console.log('DB URL prefix:', databaseUrl.substring(0, 15) + '...');
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    
    // Havuzu test et
    pool.on('error', (err) => {
      console.error('PostgreSQL havuzu hatası:', err);
      pool = undefined; // Havuzu sıfırla
    });
    
    pool.on('connect', () => {
      console.log('PostgreSQL bağlantısı kuruldu');
    });
  }
  
  return pool;
}

// SQL sorgusu çalıştırma
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  console.log('[DB] SQL Sorgusu Başlatılıyor:', query.slice(0, 100) + '...');
  console.log('[DB] Parametreler:', JSON.stringify(params));
  
  let client;
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log('[DB] Bağlantı URL (kısmi):', connectionString ? connectionString.substring(0, 25) + '...' : 'tanımlanmamış');
    
    if (!connectionString) {
      throw new Error('DATABASE_URL ortam değişkeni tanımlanmamış');
    }

    const pool = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false // Vercel üzerinde SSL bağlantı sorunları için
      }
    });
    
    client = await pool.connect();
    console.log('[DB] Veritabanı bağlantısı başarılı');
    
    const result = await client.query(query, params);
    console.log('[DB] Sorgu başarılı, satır sayısı:', result.rowCount);
    return result;
  } catch (error) {
    console.error('[DB] Veritabanı hatası:', error);
    console.error('[DB] Hata detayları:', JSON.stringify({
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    }, null, 2));
    
    throw error;
  } finally {
    if (client) {
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