import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { db } from "../../../lib/db";
import { visitedLocations, visitedPlaces, visitedLogs } from "../../../lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  // 💡 URLから特定の location_id を取得
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');

  if (!locationId) {
    return NextResponse.json({ error: 'location_id is required' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
  }

  const sql = neon(databaseUrl);

  /*try {
    // 💡 履歴テーブル(visited_log)から、その場所の記録を降順(DESC)で取得
    // place_id や ID も含めて、フロント側で key に使えるようにします
    const logs = await sql`
      SELECT id, visited_at, place_id
      FROM visited_logs
      WHERE location_id = ${Number(locationId)}
      ORDER BY visited_at DESC
    `;
    const formattedLogs = logs.map(log => ({
      ...log,
      // DateオブジェクトならISO形式(Z付き)に、文字列ならTとZを補完する
      visited_at: log.visited_at
        ? (log.visited_at instanceof Date
          ? log.visited_at.toISOString()
          : String(log.visited_at).replace(' ', 'T') + 'Z')
        : null
    }));*/
try {
  // 💡 Drizzleで取得
  const logs = await db
    .select({
      id: visitedLogs.id,
      visited_at: visitedLogs.visited_at,
      place_id: visitedLogs.place_id,
      //comment: visitedLogs.comment, // 💡 これでコメントも一緒に取れます
    })
    .from(visitedLogs)
    .where(eq(visitedLogs.location_id, Number(locationId)))
    .orderBy(desc(visitedLogs.visited_at));

  const formattedLogs = logs.map(log => ({
    ...log,
    // DrizzleがDateオブジェクトとして返してくれるので、そのまま toISOString() が使えます
    visited_at: log.visited_at instanceof Date 
      ? log.visited_at.toISOString() 
      : log.visited_at 
        ? String(log.visited_at).replace(' ', 'T') + 'Z' 
        : null
  }));
    return NextResponse.json(formattedLogs);

  } catch (error) {
    console.error('❌ Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
