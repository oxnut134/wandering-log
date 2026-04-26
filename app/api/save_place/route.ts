import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
    const body = await request.json();

    const { location_id, google_place_id, name, category, address } = body;

    const result = await db.transaction(async (tx) => {
        let locationId = location_id;
        let placeId = null;
        if (locationId) {

                const [place] = await tx.insert(visitedPlaces).values({
                    location_id: location_id,
                    google_place_id: google_place_id,
                    name: name,
                    category: category,
                    address: address
                }).returning();
                placeId = place.id;
        }

        return { place_id: placeId };
    });
    return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "保存失敗" }, { status: 500 });
    }
}

