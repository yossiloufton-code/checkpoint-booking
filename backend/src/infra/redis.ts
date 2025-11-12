// src/infra/redis.ts
import { createClient } from "redis";

// Infer the exact client type from createClient:
type RedisClient = ReturnType<typeof createClient>;

let redis: RedisClient | null = null;

export async function getRedis(): Promise<RedisClient | null> {
    if (redis) return redis;

    const url = process.env.REDIS_URL || "redis://localhost:6379";
    const client = createClient({ url });

    client.on("error", (err) => {
        console.error("[redis] error:", (err as any)?.message || err);
    });

    try {
        await client.connect();
        await client.ping();
        console.log("[redis] connected");
        redis = client; // ✅ types line up now
    } catch (e) {
        console.warn("[redis] unavailable, will run without cache");
        redis = null; // ✅ consistent with return type
    }

    // graceful shutdown
    process.on("beforeExit", async () => {
        try { await client.quit(); } catch { }
    });

    return redis;
}
