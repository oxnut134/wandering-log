import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs, visitedComments } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {

        console.log("************ in save_comments ***************")
        const body = await request.json();

        const { log_id, commentText } = body;

        const result = await db.transaction(async (tx) => {
            let logId = log_id;
            let commentId = null;
            if (logId) {

                const [comment] = await tx.insert(visitedComments).values({
                    log_id: log_id,
                    comment: commentText,
                }).returning();
                commentId = comment.id;
            }

            return { comment_id: commentId };
        });
        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "保存失敗" }, { status: 500 });
    }
}

