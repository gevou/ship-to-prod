import { NextResponse } from 'next/server';
import { getRedis, seedThreads } from '@/lib/redis';

export async function GET() {
  const redis = await getRedis();
  await seedThreads(redis);

  const ids = await redis.sMembers('threads');
  const threads = await Promise.all(
    ids.map(async (id: string) => {
      const data = await redis.hGetAll(`thread:${id}`);
      const messageCount = await redis.lLen(`thread:${id}:messages`);
      return { id, ...data, messageCount };
    })
  );

  return NextResponse.json(threads);
}

export async function POST(request: Request) {
  const redis = await getRedis();
  await seedThreads(redis);

  const body = await request.json();
  const { id, name, status, summary } = body;

  const threadId = id || name.toLowerCase().replace(/\s+/g, '-');
  await redis.hSet(`thread:${threadId}`, {
    name,
    status: status || 'active',
    summary: summary || '',
  });
  await redis.sAdd('threads', threadId);

  const data = await redis.hGetAll(`thread:${threadId}`);
  return NextResponse.json({ id: threadId, ...data });
}
