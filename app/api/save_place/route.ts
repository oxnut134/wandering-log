import { db } from "../../../lib/db";
import { visitedPlaces } from "../../../lib/schema";
import { count, and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";


export async function POST(request: Request) {
    /*try {
        const body = await request.json();

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const currentUserId = parseInt(session.user.id, 10);
        const { id, location_id, google_place_id, name, category, address } = body;
        //const { id, latitude, longitude, name, comment, googleData } = body;
        //console.log("latitude>>>>>>>>>>>>>>>>>>>>>>>>>>>>", latitude)
        //console.log("longitude>>>>>>>>>>>>>>>>>>>>>>>>>>>>", longitude)
console.log("body>>>>>>>>>>>>>>>>>>>>>>>>>>",body)
        const result = await db.transaction(async (tx) => {

            // 🎯 1. 解決の核心：id が空、または文字列の "new" が含まれている時は
            // 無駄な既存検索を 100% スキップして、ストレートに【新規保存（insert）】へ直撃させます！
            const isNew = !id || String(id).includes("new");

            if (isNew) {
                // 🆕 【新規訪問先の保存（INSERT）】
                const [newLoc] = await tx.insert(visitedPlaces).values({
                    location_id: 1,
                    google_place_id: google_place_id,
                    name: name,
                    category: category,
                    address: address
                }).returning();

                console.log("👣 新規ピンの登録が完全成功！発行された数値ID:", newLoc.id);
                return { id: newLoc.id };
            }

            // 🔄 2. 【既存訪問先の更新（UPDATE）】（本物の数字IDの時だけここを通る）
            const locationRecord = await tx.select()
                .from(visitedPlaces)
                .where(
                    and(
                        eq(visitedPlaces.id, Number(id)), // ➔ 数字IDしか来ないので Number() で安全にキャスト
                        //eq(visitedPlaces.user_id, currentUserId)
                    )
                )
                .limit(1);

            if (locationRecord.length > 0) {
                await tx.update(visitedPlaces)
                    .set({
                    location_id: location_id,
                    google_place_id: google_place_id,
                    name: name,
                    category: category,
                    address: address
                   })
                    .where(eq(visitedPlaces.id, Number(id)));
            }

            return { id: Number(id) };
        });

        return NextResponse.json(result);*/
    /*const result = await db.transaction(async (tx) => {
        let locationId = id;
        let placeId = null;
        if (locationId) {
            //該当レコード検索
            const locationRecord = await tx.select()
                .from(visitedPlaces)
                .where(
                    and(
                        eq(visitedPlaces.id, locationId),
                        eq(visitedPlaces.user_id, currentUserId)
                    )
                )
                .limit(1);
 
            if (locationRecord.length > 0) {
                //既存訪問先保存
                await tx.update(visitedPlaces)
                    .set({
                        latitude: String(latitude),
                        longitude: String(longitude),
                        name,
                        comment,
                        user_id: currentUserId,
                        created_at: new Date()
                    })
                    .where(eq(visitedPlaces.id, id));
 
            } else {
                // ② 新規訪問先保存
                const [newLoc] = await tx.insert(visitedPlaces).values({
                    latitude: String(latitude),
                    longitude: String(longitude),
                    name,
                    comment,
                    user_id: currentUserId,
                    updated_at: new Date() // 仕様：最初に登録した日時
                }).returning();
                locationId = newLoc.id;
 
            }
        } else {
            //  新規訪問先保存
            const [newLoc] = await tx.insert(visitedPlaces).values({
                latitude: String(latitude),
                longitude: String(longitude),
                name,
                comment,
                user_id: currentUserId,
                updated_at: new Date()
            }).returning();
            locationId = newLoc.id;
 
        }
 
        return { id: locationId };
    });
    //return NextResponse.json(result);
} catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存失敗" }, { status: 500 });
}
}*/

    try {
        const body = await request.json();

        //console.log("body:", body)
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const currentUserId = parseInt(session.user.id, 10);
        const { id, location_id, google_place_id, name, category, address } = body;

        console.log("body>>>>>>>>>>>>>>>>>>>>>>>>>>>>", body)
        //console.log("currentUserId>>>>>>>>>>>>>>>>>>>>>>>>>>>>", currentUserId)
        const [recordCount] = await db.select({ value: count() }).from(visitedPlaces);
        let locationId = id;
        let placeId = null;

        const result = await db.transaction(async (tx) => {
            let locationId = location_id;
            let placeId = null;

            if (recordCount.value === 0) {
                const [newLoc] = await tx.insert(visitedPlaces).values({
                    location_id: locationId,
                    google_place_id: google_place_id,
                    name: name,
                    category: category,
                    address: address
                }).returning();
                locationId = newLoc.id;
            } else {
                //if (locationId) {
                //該当レコード検索
                const placeRecord = await tx.select()
                    .from(visitedPlaces)
                    .where(
                        and(
                            eq(visitedPlaces.location_id, locationId),
                        )
                    )
                    .limit(1);

                // const existingRecords = await tx.select()
                //     .from(visitedPlaces)
                //     .where(eq(visitedPlaces.location_id, Number(locationId)))
                //     .limit(1);

                // 🏆 この1行で、同じIDが「ある（true）」か「ない（false）」かを完璧に判定します！
                //const existSameLocationId = existingRecords.length > 0;


                if (placeRecord.length > 0) {
                    //既存訪問先保存
                    await tx.update(visitedPlaces)
                        .set({
                            location_id: location_id,
                            google_place_id: google_place_id,
                            name: name,
                            category: category,
                            address: address
                        })
                        .where(eq(visitedPlaces.id, id));

                } else {
                    // ② 新規訪問先保存
                    const [newLoc] = await tx.insert(visitedPlaces).values({
                        location_id: location_id,
                        google_place_id: google_place_id,
                        name: name,
                        category: category,
                        address: address
                    }).returning();
                    locationId = newLoc.id;

                }
            }
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
        await db.delete(visitedPlaces).where(eq(visitedPlaces.id, id));
        return NextResponse.json({ success: true });
    } catch (e) { return NextResponse.json({ error: "削除失敗" }, { status: 500 }); }
}*/
