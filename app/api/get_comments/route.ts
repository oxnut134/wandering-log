import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedComments, } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  // 💡 URLから特定の location_id を取得
  const { searchParams } = new URL(request.url);
  const logId = searchParams.get('log_id');

  if (!logId) {
    return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
  }

  const sql = neon(databaseUrl);


try {
  // 💡 Drizzleで取得gf
  const comments = await db
    .select({
      id: visitedComments.id,
      comment: visitedComments.comment,
        //comment: visitedComments.comment, // 💡 これでコメントも一緒に取れます
    })
    .from(visitedComments)
    .where(eq(visitedComments.log_id, Number(logId)))
   //. orderBy(desc(visitedComments.visited_at));

    return NextResponse.json(comments);

  } catch (error) {
    console.error('❌ Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
