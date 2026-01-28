import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'booth',
  password: process.env.DB_PASSWORD || 'booth_dev_2024',
  database: process.env.DB_NAME || 'booth',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS bornes (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(50) NOT NULL,
        numero_serie VARCHAR(100) NOT NULL,
        antenne_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_bornes_numero ON bornes(numero)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bornes_numero_serie ON bornes(numero_serie)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bornes_antenne_id ON bornes(antenne_id)`);

    // Insert default data if table is empty
    const result = await client.query('SELECT COUNT(*) FROM bornes');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('Inserting default data...');
      await client.query(`
        INSERT INTO bornes (numero, numero_serie, antenne_id) VALUES
        ('B001', 'SN-2024-001', 1),
        ('B002', 'SN-2024-002', 1),
        ('B003', 'SN-2024-003', 2),
        ('B004', 'SN-2024-004', 3)
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
