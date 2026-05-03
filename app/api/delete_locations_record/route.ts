import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// 🗑️ DELETE: 削除
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await db.delete(visitedLocations).where(eq(visitedLocations.id, id));
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "削除失敗" }, { status: 500 }); }
}
