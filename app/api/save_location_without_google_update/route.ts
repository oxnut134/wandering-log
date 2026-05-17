import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { count, and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";


export async function POST(request: Request) {
    try {
        const body = await request.json();

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const currentUserId = parseInt(session.user.id, 10);
        const { id, latitude, longitude, name, comment, googleData } = body;
        console.log("body>>>>>>>>>>>>>>>>>>>>>>>>>>>>", body)
        const [recordCount] = await db.select({ value: count() }).from(visitedLocations);
        let locationId = id;
        let placeId = null;

        const result = await db.transaction(async (tx) => {
            if (recordCount.value === 0) {
                const [newLoc] = await tx.insert(visitedLocations).values({
                    latitude: String(latitude),
                    longitude: String(longitude),
                    name,
                    comment,
                    user_id: currentUserId,
                    updated_at: new Date() // 仕様：最初に登録した日時
                }).returning();
                locationId = newLoc.id;
            } else {

                //if (locationId) {
                //該当レコード検索
                const locationRecord = await tx.select()
                    .from(visitedLocations)
                    .where(
                        and(
                            eq(visitedLocations.id, locationId),
                            eq(visitedLocations.user_id, currentUserId)
                        )
                    )
                    .limit(1);

                if (locationRecord.length > 0) {
                    //既存訪問先保存
                    await tx.update(visitedLocations)
                        .set({
                            latitude: String(latitude),
                            longitude: String(longitude),
                            name,
                            comment,
                            user_id: currentUserId,
                            created_at: new Date()
                        })
                        .where(eq(visitedLocations.id, id));

                } else {
                    // ② 新規訪問先保存
                    const [newLoc] = await tx.insert(visitedLocations).values({
                        latitude: String(latitude),
                        longitude: String(longitude),
                        name,
                        comment,
                        user_id: currentUserId,
                        updated_at: new Date() // 仕様：最初に登録した日時
                    }).returning();
                    locationId = newLoc.id;

                }
            }
            /*
            await tx.insert(visitedLogs).values({
                location_id: locationId,
                place_id: placeId,
                user_id: currentUserId,
                visited_at: new Date()
            });
            */
            return { id: locationId };
        });
        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "保存失敗" }, { status: 500 });
    }
}

// 🗑️ DELETE: 削除
/*export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await db.delete(visitedLocations).where(eq(visitedLocations.id, id));
        return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: "削除失敗" }, { status: 500 }); }
}*/
