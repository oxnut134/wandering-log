import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs, visitedComments } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("************ in save_comments (Update mode) ***************")
        const body = await request.json();
        const { log_id, commentText } = body;

        if (!log_id) return NextResponse.json({ error: "log_idが必要です" }, { status: 400 });

        const result = await db.transaction(async (tx) => {
            // 💡 update を使って、特定の log_id のレコードを書き換える
            const [updatedComment] = await tx
                .update(visitedComments)
                .set({ 
                    comment: commentText,
                    // updated_at: new Date() // もし更新日時カラムがあれば追加
                })
                .where(eq(visitedComments.log_id, log_id))
                .returning();

            // 💡 もしレコードがまだ存在しない（初コメント）場合は insert するロジック
            if (!updatedComment) {
                const [newComment] = await tx.insert(visitedComments).values({
                    log_id: log_id,
                    comment: commentText,
                }).returning();
                return { comment_id: newComment.id, status: "inserted" };
            }

            return { comment_id: updatedComment.id, status: "updated" };
        });

        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "保存失敗" }, { status: 500 });
    }
}


