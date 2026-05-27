// 💡 app/api/register/route.ts
import { NextResponse } from 'next/server';
import { users } from '../../../lib/schema'; 
import { eq, ilike } from 'drizzle-orm'; 
import { db } from "../../../lib/db";
import bcrypt from "bcryptjs"
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ message: '入力項目が足りません。' }, { status: 400 });
        }

        const cleanEmail = email.trim(); 

        const existingUser = await db
            .select()
            .from(users)
            .where(ilike(users.email, cleanEmail))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json({ message: 'このメールアドレスは既に登録されています。' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        await db.insert(users).values({
            name: name,
            email: cleanEmail,
            password: hashedPassword, 
        });

        console.log(`🎉 ユーザー [${name}] を Drizzle を経由して Neon へ正常に手動保存しました！`);

        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

    } catch (error) {
        console.error("🚨 Drizzle 保存中にバックエンドで致命的なエラー:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
