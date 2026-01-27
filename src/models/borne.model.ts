import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'booth',
  password: process.env.DB_PASSWORD || 'booth_dev_2024',
  database: process.env.DB_NAME || 'booth',
});

export interface Borne {
  id: number;
  numero: string;
  numero_serie: string;
  antenne_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBorneDTO {
  numero: string;
  numero_serie: string;
  antenne_id: number;
}

export interface UpdateBorneDTO {
  numero?: string;
  numero_serie?: string;
  antenne_id?: number;
}

export class BorneModel {
  static async findAll(page: number = 1, limit: number = 20): Promise<{ data: Borne[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM bornes');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM bornes ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return { data: result.rows, total };
  }

  static async findById(id: number): Promise<Borne | null> {
    const result = await pool.query('SELECT * FROM bornes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByAntenneId(antenneId: number): Promise<Borne[]> {
    const result = await pool.query(
      'SELECT * FROM bornes WHERE antenne_id = $1 ORDER BY numero',
      [antenneId]
    );
    return result.rows;
  }

  static async create(data: CreateBorneDTO): Promise<Borne> {
    const result = await pool.query(
      `INSERT INTO bornes (numero, numero_serie, antenne_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.numero, data.numero_serie, data.antenne_id]
    );
    return result.rows[0];
  }

  static async update(id: number, data: UpdateBorneDTO): Promise<Borne | null> {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (data.numero !== undefined) {
      fields.push(`numero = $${paramIndex++}`);
      values.push(data.numero);
    }
    if (data.numero_serie !== undefined) {
      fields.push(`numero_serie = $${paramIndex++}`);
      values.push(data.numero_serie);
    }
    if (data.antenne_id !== undefined) {
      fields.push(`antenne_id = $${paramIndex++}`);
      values.push(data.antenne_id);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE bornes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM bornes WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getStats(): Promise<{ total: number; by_antenne: { antenne_id: number; count: number }[] }> {
    const totalResult = await pool.query('SELECT COUNT(*) FROM bornes');
    const byAntenneResult = await pool.query(
      'SELECT antenne_id, COUNT(*) as count FROM bornes WHERE antenne_id IS NOT NULL GROUP BY antenne_id ORDER BY antenne_id'
    );

    return {
      total: parseInt(totalResult.rows[0].count),
      by_antenne: byAntenneResult.rows.map(row => ({
        antenne_id: row.antenne_id,
        count: parseInt(row.count),
      })),
    };
  }

  static async detachFromAntenne(antenneId: number): Promise<number> {
    const result = await pool.query(
      `UPDATE bornes SET antenne_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE antenne_id = $1`,
      [antenneId]
    );
    return result.rowCount ?? 0;
  }

  static async findDetached(): Promise<Borne[]> {
    const result = await pool.query(
      'SELECT * FROM bornes WHERE antenne_id IS NULL ORDER BY numero'
    );
    return result.rows;
  }
}
