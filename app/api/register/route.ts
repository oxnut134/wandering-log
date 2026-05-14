// 💡 app/api/register/route.ts
import { NextResponse } from 'next/server';
import { users } from '../../../lib/schema'; 
import { eq, ilike } from 'drizzle-orm'; 
import { db } from "../../../lib/db";
import bcrypt from "bcryptjs"
//import { visitedLocations, visitedPlaces, visitedLogs, visitedComments } from "../../../lib/schema";
//import { eq, desc } from "drizzle-orm";
//import { NextResponse } from "next/server";
export async function POST(request: Request) {
    try {
        // 1. フロントの fetch から送られてきた JSON データを受け取る
        const body = await request.json();
        const { name, email, password } = body;

        // 空っぽのデータが来たらエラーとして弾く防衛線
        if (!name || !email || !password) {
            return NextResponse.json({ message: '入力項目が足りません。' }, { status: 400 });
        }

        const cleanEmail = email.trim(); // 前後の余計な空白を強制排除

        // 🔍 2. Drizzleで重複チェック：大文字・小文字を無視（ilike）して既存ユーザーを検索
        const existingUser = await db
            .select()
            .from(users)
            .where(ilike(users.email, cleanEmail))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json({ message: 'このメールアドレスは既に登録されています。' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 


        // 🔥 3. 【本星】Drizzle の構文で users テーブルに手動でインサート（保存）する！
        await db.insert(users).values({
            name: name,
            email: cleanEmail,
            password: hashedPassword, // 💡 パスワードハッシュ化を行う場合はここに暗号化した値を入れます
        });

        console.log(`🎉 ユーザー [${name}] を Drizzle を経由して Neon へ正常に手動保存しました！`);

        // フロントへ「インサート成功！」の合図を送る
        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

    } catch (error) {
        console.error("🚨 Drizzle 保存中にバックエンドで致命的なエラー:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
