import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// 💡 接続プールを作成。process.env.DATABASE_URL を直接叩き込みます！
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Renderの接続にはこれが必須です
  },
});

export const db = drizzle(pool);
