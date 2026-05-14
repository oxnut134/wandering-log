// 💡 app/api/auth/[...nextauth]/route.ts [INDEX]

// 🎯 1. 新設した中央管理室（auth.ts）から本物の handlers をインポート [INDEX]
import { handlers } from "@/auth"; 

// 🎯 2. Next.jsのRoute Handlers用の HTTP メソッドとしてそのままエクスポートして終了！ [INDEX]
export const { GET, POST } = handlers;
