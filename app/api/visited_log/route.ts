import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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

  try {
    // 💡 履歴テーブル(visited_log)から、その場所の記録を降順(DESC)で取得
    // place_id や ID も含めて、フロント側で key に使えるようにします
    const logs = await sql`
      SELECT id, visited_at, place_id
      FROM visited_logs
      WHERE location_id = ${Number(locationId)}
      ORDER BY visited_at DESC
    `;

    console.log(`📜 LocationID: ${locationId} の履歴を ${logs.length} 件取得しました`);
    return NextResponse.json(logs);

  } catch (error) {
    console.error('❌ Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
