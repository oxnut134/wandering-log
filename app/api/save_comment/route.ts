import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs, visitedComments } from "../../../lib/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = parseInt(session.user.id, 10);

    try {
        const body = await request.json();
        const { log_id, commentText } = body;

        if (!log_id) return NextResponse.json({ error: "log_idが必要です" }, { status: 400 });

        const result = await db.transaction(async (tx) => {
            const [updatedComment] = await tx
                .update(visitedComments)
                .set({
                    comment: commentText,
                    user_id: currentUserId
                })
                .where(and(
                    eq(visitedComments.log_id, log_id),
                    eq(visitedComments.user_id, currentUserId)
                ))
                .returning();

            if (!updatedComment) {
                const [newComment] = await tx.insert(visitedComments).values({
                    log_id: log_id,
                    user_id: currentUserId,
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


