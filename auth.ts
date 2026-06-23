// 💡 auth.ts (プロジェクトのルート直下に新設) [INDEX]
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./lib/db";              // 🎯 お使いのパスに微調整してください
import { users } from './lib/schema';         // 🎯 お使いのパスに微調整してください
import { eq } from 'drizzle-orm';
import bcrypt from "bcryptjs";

// 🎯 核心：ここで初期化を1回だけ行い、強力な「4つの武器」をエクスポートする！ [INDEX]
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                trialToken: { label: "Trial Token", type: "text" }
            },
            async authorize(credentials) {
                // Trial token flow
                if (credentials?.trialToken) {
                    if (
                        credentials.trialToken !== process.env.TRIAL_TOKEN ||
                        credentials.email !== "demo@example.com"
                    ) return null;
                    const result = await db.select().from(users).where(eq(users.email, "demo@example.com")).limit(1);
                    const user = result[0];
                    if (!user) return null;
                    return { id: user.id.toString(), name: user.name, email: user.email };
                }

                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const email = credentials.email as string;
                    const password = credentials.password as string;

                    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
                    const user = result[0];

                    if (!user || !user.password) return null;

                    const isPasswordCorrect = await bcrypt.compare(password, user.password);
                    if (!isPasswordCorrect) return null;

                    return { id: user.id.toString(), name: user.name, email: user.email };
                } catch (error) {
                    return null;
                }
            }
        })
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    secret: process.env.AUTH_SECRET || "any-random-super-secret-string-1234567890-abcdefg",
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id; // 🔑 1. ログインの瞬間に、IDを暗号トークンに刻印する
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string; // 🔑 2. API側で読み取れるようにセッションにIDを流し込む
            }
            return session;
        }
    }
});
