// 💡 app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
//import { db } from "@/db"; // 🎯 プロジェクトの Drizzle db インスタンスのパス
//import { users } from "@/db/schema"; // 🎯 users テーブル定義のパス
//import { eq, ilike } from "drizzle-orm";
import { NextResponse } from 'next/server';
import { users } from '../../../../lib/schema';
import { eq, ilike } from 'drizzle-orm';
import { db } from "../../../../lib/db";
import bcrypt from "bcryptjs"


export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {

                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const cleanEmail = credentials.email;

                    // 🎯 Drizzle の構文で Neon からユーザーを1件だけ型安全に取得！
                    const result = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, cleanEmail as string))
                        .limit(1);

                    const user = result[0];

                    const isPasswordCorrect = await bcrypt.compare(credentials.password as string, user.password);

                    // 🔍 パスワードが一致しない場合は即座に弾く
                    if (!isPasswordCorrect) {
                        return null;
                    }
                    
                    // 🎉 検証成功！ NextAuthにユーザー情報を引き渡す（idは必ず文字列にする）
                    return {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.email
                    };

                } catch (error) {
                    console.error("🚨 NextAuth Drizzle データベースエラー:", error);
                    return null;
                }
            }
        })
    ],
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET || "any-random-super-secret-string-1234567890-abcdefg",
});
