// src/services/RoomService.ts
import { AppDataSource } from "../config/data-source";
import { Room } from "../entities/Room";

const roomRepo = AppDataSource.getRepository(Room);

export interface RoomSearchParams {
  location?: string;
  minCapacity?: number;
  startTime?: string;
  endTime?: string;
  page: number;
  limit: number;
}

export class RoomService {
  static async search(params: RoomSearchParams = { page: 1, limit: 20 }) {
    const {
      location,
      minCapacity,
      startTime,
      endTime,
      page = 1,
      limit = 20,
    } = params;

    const qb = roomRepo.createQueryBuilder("room");

    if (location) {
      qb.andWhere("room.location ILIKE :location", { location: `%${location}%` });
    }

    if (typeof minCapacity === "number") {
      qb.andWhere("room.capacity >= :minCapacity", { minCapacity });
    }

    if (startTime && endTime) {
      // availability window must cover the requested range
      qb.andWhere("(room.availableFrom IS NULL OR room.availableFrom <= :startTime)", { startTime })
        .andWhere("(room.availableTo   IS NULL OR room.availableTo   >= :endTime)", { endTime });

      // exclude rooms with overlapping active bookings/holds
      qb.leftJoin(
        "room.bookings",
        "booking",
        `
        booking.startTime < :endTime
        AND booking.endTime > :startTime
        AND (
          booking.status = 'CONFIRMED'
          OR (booking.status = 'PENDING' AND booking.expiresAt IS NOT NULL AND booking.expiresAt > NOW())
        )
      `,
        { startTime, endTime }
      ).andWhere("booking.id IS NULL");
    }

    qb.orderBy("room.location", "ASC").addOrderBy("room.name", "ASC");

    // 🔑 pagination (+ distinct to avoid duplicates from the join)
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(50, Math.max(1, limit));
    const offset = (pageNum - 1) * pageSize;

    qb.distinct(true).skip(offset).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    const hasMore = offset + items.length < total;

    return { items, total, page: pageNum, pageSize, hasMore };
  }

  static async findById(id: string) {
    const repo = AppDataSource.getRepository(Room);
    const room = await repo.findOne({ where: { id } });
    if (!room) {
      const e: any = new Error("Room not found");
      e.status = 404;
      throw e;
    }
    return room;
  }

}
