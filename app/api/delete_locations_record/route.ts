import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { and,eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// 🗑️ DELETE: 削除
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = parseInt(session.user.id, 10);

  try {
    const { id } = await request.json();
    await db.delete(visitedLocations).where(and(eq(visitedLocations.id, id),eq(visitedLocations.user_id, currentUserId)));
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "削除失敗" }, { status: 500 }); }
}
