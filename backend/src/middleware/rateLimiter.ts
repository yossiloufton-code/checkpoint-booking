import rateLimit, { type Options } from "express-rate-limit";
import type { Request, Response } from "express";

/** Build a stable client key (never undefined) */
function clientKey(req: Request): string {
  // prefer real IP; fall back to XFF or remoteAddress
  const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return req.ip || xff || req.socket.remoteAddress || "anon";
}

/** Common options (typed as Partial<Options>) */
const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  // don’t rate-limit preflight
  skip: (req: Request, _res: Response) => req.method === "OPTIONS",
  // v7 signature requires string | Promise<string>
  keyGenerator: (req: Request, _res: Response) => clientKey(req),
  message: { message: "Too many requests, please try again later." },
};

/** Baseline limiter for all /api traffic */
export const apiRateLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,  // 1 minute
  limit: 300,           // v7 uses "limit" (NOT "max")
} as Options);

/** Stricter: auth endpoints */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
} as Options);

/** Stricter: bookings create/hold/confirm/cancel */
export const bookingsLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  limit: 20,
} as Options);

/** Moderate: rooms search/list */
export const roomsLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 minute
  limit: 120,
} as Options);
