import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// 👣 1. 取得用（地図にピンを表示するため）
export async function GET() {
  try {
    const results = await db.select({
      id: visitedLocations.id,
      lat: visitedLocations.latitude,
      lng: visitedLocations.longitude,
      comment: visitedLocations.comment,
      placeName: visitedPlaces.name,
      createdAt: visitedLocations.createdAt,
    })
      .from(visitedLocations)
      .leftJoin(visitedPlaces, eq(visitedLocations.id, visitedPlaces.locationId))
      .orderBy(desc(visitedLocations.createdAt));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}

// 📍 2. 保存用（モーダルから登録するため）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, comment, google_name, google_place_id, google_category, google_address } = body;

    const existingLocation = await db.select()
      .from(visitedLocations)
      .where(
        and(
          sql`ABS(latitude - ${lat}) < 0.0001`,
          sql`ABS(longitude - ${lng}) < 0.0001`
        )
      )
      .limit(1);
    if (existingLocation.length > 0) {
      // 💡 すでに存在する場合：新規作成せず、既存のIDを返して終了（あるいはエラーを返す）
      
      return NextResponse.json({
        message: "この場所はすでに放浪記に刻まれています。",
        id: existingLocation[0].id
      }, { status: 200 }); // 200(OK)で返して、フロント側で「既にあります」と出す
    }
        const result = await db.transaction(async (tx) => {
      // ① Location保存
      const [loc] = await tx.insert(visitedLocations).values({
        latitude: String(lat),
        longitude: String(lng),
        comment: comment || null,
      }).returning();

      // ② Google情報があれば Place と Log を作成
      if (google_place_id) {
        const [place] = await tx.insert(visitedPlaces).values({
          locationId: loc.id,
          googlePlaceId: google_place_id,
          name: google_name,
          category: google_category,
          address: google_address,
        }).returning();

        await tx.insert(visitedLogs).values({ placeId: place.id });
      }
      return loc;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("保存失敗:", error);
    return NextResponse.json({ error: "保存失敗" }, { status: 500 });
  }
}
