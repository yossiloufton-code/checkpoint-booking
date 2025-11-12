// src/cache/invalidation.ts
import { getRedis } from "../infra/redis";

export async function invalidateRoomsCache() {
  const redis = await getRedis();
  if (!redis) return;

  const pattern = "cache:/api/rooms*";
  const batch: string[] = [];

  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    batch.push(...key);
    if (batch.length >= 200) {
      await redis.del(batch);
      batch.length = 0;
    }
  }
  if (batch.length) await redis.del(batch);
}
