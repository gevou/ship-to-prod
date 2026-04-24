import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRedis, seedThreads } from '@/lib/redis';

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { utterance } = await request.json();

  const redis = await getRedis();
  await seedThreads(redis);

  const ids = await redis.sMembers('threads');
  const threads = await Promise.all(
    ids.map(async (id: string) => {
      const data = await redis.hGetAll(`thread:${id}`);
      return { id, ...data };
    })
  );

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a thread classifier. Given an utterance and a list of threads, return the thread ID that best matches the utterance. If no thread matches, return "none". Return ONLY the thread ID or "none" — nothing else.

Threads:
${threads.map((t: any) => `- ${t.id}: ${t.name} — ${t.summary}`).join('\n')}`,
      },
      { role: 'user', content: utterance },
    ],
    max_tokens: 50,
  });

  const threadId = completion.choices[0].message.content?.trim() || 'none';
  const thread = threads.find((t: any) => t.id === threadId) || null;

  return NextResponse.json({ threadId, thread });
}
