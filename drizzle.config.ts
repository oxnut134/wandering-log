import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts", // 💡 さっきスキーマを書いたファイルのパスに合わせてください
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // 💡 .env にある Render の接続 URL を使用
  },
});
