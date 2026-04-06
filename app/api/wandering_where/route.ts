import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// 👣 GET: 起動時の全件取得
export async function GET() {
  try {
    const results = await db.select({
      id: visitedLocations.id,
      latitude: visitedLocations.latitude,
      longitude: visitedLocations.longitude,
      name: visitedLocations.name,
      comment: visitedLocations.comment,
      google_place_id: visitedPlaces.google_place_id,
      address: visitedPlaces.address,
      category: visitedPlaces.category,
      place_id: visitedPlaces.id
    })
      .from(visitedLocations)
      .leftJoin(visitedPlaces, eq(visitedLocations.id, visitedPlaces.location_id))
      console.log("results", results);
    return NextResponse.json(results);
  } catch (e) { return NextResponse.json({ error: "取得失敗" }, { status: 500 }); }
}

// 📍 POST: 保存（②新規・③上書き）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, latitude, longitude, name, comment, googleData } = body;

    const result = await db.transaction(async (tx) => {
      let locId = id;
      let pId = null;
      if (locId) {
        // ③ 既存の上書き保存
        await tx.update(visitedLocations)
          .set({
            name,
            comment,
            created_at: new Date() // 仕様：情報を更新した日時
          })
          .where(eq(visitedLocations.id, id)); // 💡 ここ！特定の ID 

        if (!googleData && locId) {
          // 1. 直近の訪問履歴（visited_logs）をサブクエリ的にフェッチ
          const lastLog = await tx.select()
            .from(visitedLogs)
            .where(eq(visitedLogs.location_id, locId))
            .orderBy(desc(visitedLogs.visited_at)) // 💡 最新の履歴を優先
            .limit(1);

          // 2. 直近のログに place_id が存在すれば、それを今回の pId に代入（継承）
          if (lastLog.length > 0 && lastLog[0].place_id) {
            pId = lastLog[0].place_id;
          }
        }
      } else {
        // ② 初めての訪問先保存
        const [newLoc] = await tx.insert(visitedLocations).values({
          latitude: String(latitude),
          longitude: String(longitude),
          name,
          comment,
          updated_at: new Date() // 仕様：最初に登録した日時
        }).returning();
        locId = newLoc.id;
      }

      // Place保存/更新

      if (googleData) {
        // google_place_id を基準に既存チェック
        const existingPlace = await tx.select().from(visitedPlaces)
          .where(eq(visitedPlaces.google_place_id, googleData.place_id)).limit(1);

        if (existingPlace.length > 0) {
          pId = existingPlace[0].id;
          await tx.update(visitedPlaces).set({
            name: googleData.name,
            created_at: new Date()
          }).where(eq(visitedPlaces.id, pId));
        } else {
          const [place] = await tx.insert(visitedPlaces).values({
            location_id: locId,
            google_place_id: googleData.place_id,
            name: googleData.name,
            category: googleData.category,
            address: googleData.address
          }).returning();
          pId = place.id;
        }
      }

      // 💡 仕様：保存すると visited_logs にも現在日時が保存される
      // カラム名は DB の実態（visited_at）に合わせて修正してください
      await tx.insert(visitedLogs).values({
        location_id: locId,
        place_id: pId,
        visited_at: new Date() // 昨夜の SQL で作った名前に同期
      });

      return { id: locId };
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
