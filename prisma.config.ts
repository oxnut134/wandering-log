import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// 🎯 1. 実行前に必ず .env ファイルの文字をメモリにロードする
dotenv.config();

// 🎯 2. 型チェックを通過させるため、文字列であることを厳格に保証する
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("❌ .env ファイルに DATABASE_URL が設定されていません。");
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  
  // 🎯 3. 仕様書の通り、階層を合わせて100%確定した文字列を代入します
  datasource: {
    url: dbUrl, // 💡 ここで完全に string 型（文字列）が保証されます
  },
});
