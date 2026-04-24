import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/threads/[id]/message'>
) {
  const { id } = await ctx.params;
  const redis = await getRedis();
  const { role, text } = await request.json();

  const message = JSON.stringify({ role, text, timestamp: Date.now() });
  await redis.rPush(`thread:${id}:messages`, message);

  return NextResponse.json({ success: true });
}
