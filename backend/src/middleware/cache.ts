// src/middleware/cache.ts
import type { Request, Response, NextFunction } from "express";
import { getRedis } from "../infra/redis";

function makeKey(req: Request) {
  const qp = new URLSearchParams();
  Object.entries(req.query)
    .sort(([a],[b]) => a.localeCompare(b))
    .forEach(([k, v]) => qp.append(k, String(v)));
  return `cache:${req.path}?${qp.toString()}`;
}

export function cacheGet(ttlSeconds = 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const redis = await getRedis();
    if (!redis) return next(); // no redis => skip caching

    const key = makeKey(req);
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch (e) {
      // if redis hiccups, just continue
    }

    // wrap res.json to capture body
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      res.setHeader("X-Cache", "MISS");
      // fire-and-forget set
      getRedis()
        .then((r) => r?.setEx(key, ttlSeconds, JSON.stringify(body)))
        .catch(() => {});
      return originalJson(body);
    };

    next();
  };
}
