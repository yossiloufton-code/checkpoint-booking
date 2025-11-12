// src/middleware/httpCache.ts
import apicache from "apicache";
import type { Request, Response, NextFunction } from "express";

const cache = apicache.options({
  statusCodes: { include: [200] },
  respectCacheControl: true, 
}).middleware;

export function setCacheGroup(group: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    (res as any).apicacheGroup = group;
    next();
  };
}

export { cache };
