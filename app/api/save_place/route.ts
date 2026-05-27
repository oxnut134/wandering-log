import { db } from "../../../lib/db";
import { visitedPlaces } from "../../../lib/schema";
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
        const { id, location_id, google_place_id, name, category, address } = body;

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
                const placeRecord = await tx.select()
                    .from(visitedPlaces)
                    .where(
                        and(
                            eq(visitedPlaces.location_id, locationId),
                        )
                    )
                    .limit(1);

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
                    //新規訪問先保存
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

