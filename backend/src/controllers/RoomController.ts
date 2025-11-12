import { Request, Response, NextFunction } from "express";
import { RoomService } from "../services/RoomService";

export class RoomController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        location,
        minCapacity,
        startTime,
        endTime,
        page = "1",
        limit = "12",
      } = req.query as Record<string, string>;

      const p = Math.max(1, parseInt(page || "1", 10));
      const l = Math.min(50, Math.max(1, parseInt(limit || "12", 10)));

      const { items, total, hasMore } = await RoomService.search({
        location,
        minCapacity: minCapacity ? Number(minCapacity) : undefined,
        startTime,
        endTime,
        page: p,
        limit: l,
      });

      res.json({ data: items, total, page: p, pageSize: l, hasMore });
    } catch (e) { next(e); }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.findById(req.params.id);
      res.json(room);
    } catch (err) { next(err); }
  }
}
