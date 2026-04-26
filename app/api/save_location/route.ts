import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        //console.log("body:", body)

        const { id, latitude, longitude, name, comment, googleData } = body;

        const result = await db.transaction(async (tx) => {
            let locationId = id;
            let placeId = null;
            if (locationId) {
                //該当レコード検索
                const locationRecord = await tx.select()
                    .from(visitedLocations)
                    .where(eq(visitedLocations.id, locationId))
                    .limit(1);

                if (locationRecord.length > 0) {
                    //既存訪問先保存
                    await tx.update(visitedLocations)
                        .set({
                            name,
                            comment,
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
                        updated_at: new Date() // 仕様：最初に登録した日時
                    }).returning();
                    locationId = newLoc.id;

                }
            } else {
                //  新規訪問先保存
                const [newLoc] = await tx.insert(visitedLocations).values({
                    latitude: String(latitude),
                    longitude: String(longitude),
                    name,
                    comment,
                    updated_at: new Date()
                }).returning();
                locationId = newLoc.id;

            }
            // 訪問記録保存
            await tx.insert(visitedLogs).values({
                location_id: locationId,
                place_id: placeId,
                visited_at: new Date()
            });

            return { id: locationId };
        });
        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "保存失敗" }, { status: 500 });
    }
}

// 🗑️ DELETE: 削除
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        await db.delete(visitedLocations).where(eq(visitedLocations.id, id));
        return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: "削除失敗" }, { status: 500 }); }
}
