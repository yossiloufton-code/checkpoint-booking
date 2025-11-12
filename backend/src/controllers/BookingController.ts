// src/controllers/BookingController.ts
import { Response, NextFunction } from "express";
import { BookingService } from "../services/BookingService";
import { AuthRequest } from "../middleware/authMiddleware";
import { AppDataSource } from "../config/data-source";
import { Booking } from "../entities/Booking";

export class BookingController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id; if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { roomId, startTime, endTime } = req.body;
      const booking = await BookingService.createBooking({ userId, roomId, startTime, endTime });
      res.status(201).json(booking);
    } catch (err) { next(err); }
  }

  static async hold(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user; if (!user) return res.status(401).json({ message: "Unauthorized" });
      const { roomId, startTime, endTime } = req.body;
      const pending = await BookingService.holdBooking({
        userId: user.id,
        roomId,
        startTime,
        endTime,
        role: user.role,
      });
      res.status(201).json(pending);
    } catch (err) { next(err); }
  }

  static async confirm(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id; if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { bookingId } = req.params;
      const confirmed = await BookingService.confirmBooking(bookingId, userId);
      res.json(confirmed);
    } catch (err) { next(err); }
  }

  static async myBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { page = "1", limit = "12" } = req.query as Record<string, string>;
      const p = Math.max(1, parseInt(page || "1", 10));
      const l = Math.min(50, Math.max(1, parseInt(limit || "12", 10)));

      const result = await BookingService.listForUserPaginated(userId, p, l);
      res.json(result); // { data, total, page, hasMore }
    } catch (err) { next(err); }
  }

  // static async myBookings(req: AuthRequest, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.user?.id; if (!userId) return res.status(401).json({ message: "Unauthorized" });
  //     const p = Math.max(1, parseInt((req.query.page as string) ?? "1"));
  //     const l = Math.max(1, Math.min(100, parseInt((req.query.limit as string) ?? "20")));

  //     const repo = AppDataSource.getRepository(Booking);
  //     const [rows, total] = await repo.findAndCount({
  //       where: { user: { id: userId } },
  //       relations: ["room"],
  //       order: { startTime: "ASC" },
  //       skip: (p - 1) * l,
  //       take: l,
  //     });

  //     res.json({ data: rows.map(b => b.toJSON() ? (b as any).toJSON() : b), total, page: p, hasMore: p * l < total });
  //   } catch (err) { next(err); }
  // }

  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id; if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { bookingId } = req.params;
      const cancelled = await BookingService.cancelBooking(bookingId, userId);
      res.json(cancelled);
    } catch (err) { next(err); }
  }
}
