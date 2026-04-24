import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;

export async function getRedis(): Promise<RedisClient> {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
  }
  return client;
}

export interface Thread {
  id: string;
  name: string;
  status: string;
  summary: string;
}

const DEFAULT_THREADS: Thread[] = [
  { id: 'product-launch', name: 'Product Launch', status: 'active', summary: 'Finalizing Q3 launch feature list' },
  { id: 'research-task', name: 'Research Task', status: 'active', summary: 'Investigating competitor voice AI solutions' },
  { id: 'team-standup', name: 'Team Standup', status: 'waiting', summary: 'Daily sync at 2pm, prep needed' },
];

export async function seedThreads(redis: RedisClient) {
  const exists = await redis.sCard('threads');
  if (exists === 0) {
    for (const thread of DEFAULT_THREADS) {
      const { id: _id, ...fields } = thread;
      await redis.hSet(`thread:${thread.id}`, fields as Record<string, string>);
      await redis.sAdd('threads', thread.id);
    }
  }
}
