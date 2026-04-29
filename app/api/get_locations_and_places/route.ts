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
      //console.log("results", results);
    return NextResponse.json(results);
  } catch (e) { return NextResponse.json({ error: "取得失敗" }, { status: 500 }); }
}

// 📍 POST: 保存（②新規・③上書き）


