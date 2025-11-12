// src/services/BookingService.ts
import { AppDataSource } from "../config/data-source";
import { Booking } from "../entities/Booking";
import { Room } from "../entities/Room";
import { User } from "../entities/User";

const bookingRepo = AppDataSource.getRepository(Booking);
const roomRepo = AppDataSource.getRepository(Room);
const userRepo = AppDataSource.getRepository(User);

function asDate(d: string | Date) { return d instanceof Date ? d : new Date(d); }

export class BookingService {
  static async listForUser(userId: string) {
    return bookingRepo.find({
      where: { user: { id: userId } },
      relations: ["room"],
      order: { startTime: "ASC" },
    });
  }

  static async holdBooking(params: {
    userId: string;
    roomId: string;
    startTime: string | Date;
    endTime: string | Date;
    role: "GUEST" | "MEMBER";
  }) {
    const { userId, roomId, role } = params;
    const startTime = asDate(params.startTime);
    const endTime = asDate(params.endTime);
    if (!(startTime instanceof Date) || isNaN(+startTime) || !(endTime instanceof Date) || isNaN(+endTime)) {
      const err: any = new Error("startTime/endTime must be valid dates");
      err.status = 400;
      throw err;
    }
    if (startTime >= endTime) {
      const err: any = new Error("Invalid time range (startTime >= endTime)");
      err.status = 400;
      throw err;
    }

    const [room, user] = await Promise.all([
      roomRepo.findOne({ where: { id: roomId } }),
      userRepo.findOne({ where: { id: userId } }),
    ]);
    if (!room) { const e: any = new Error("Room not found"); e.status = 404; throw e; }
    if (!user) { const e: any = new Error("User not found"); e.status = 404; throw e; }

    // Overlap check: block if confirmed OR (pending & not expired)
    const nowIso = new Date().toISOString();
    const roomIsHeld = await bookingRepo
      .createQueryBuilder("b")
      .innerJoin("b.room", "r")
      .where("r.id = :roomId", { roomId })
      .andWhere("(b.status = 'PENDING' OR b.status = 'CONFIRMED')")
      .andWhere("b.expiresAt IS NOT NULL AND b.expiresAt > :nowIso", { nowIso: new Date().toISOString() })
      .getOne();

    if (roomIsHeld) {
      const err: any = new Error("Room is currently held or you have a room in these dates pending. Try again after the hold expires.");
      err.status = 409;
      throw err;
    }

    // 2) Does the requested range collide with any CONFIRMED stay for this room?
    const confirmedCollision = await bookingRepo
      .createQueryBuilder("b")
      .innerJoin("b.room", "r")
      .where("r.id = :roomId", { roomId })
      .andWhere("b.status = 'CONFIRMED'")
      .andWhere("b.startTime < :endTime", { endTime })
      .andWhere("b.endTime   > :startTime", { startTime })
      .getOne();

    if (confirmedCollision) {
      const err: any = new Error("Requested dates overlap an existing confirmed booking.");
      err.status = 409;
      throw err;
    }

    const holdMinutes = role === "GUEST" ? 1 : 2; // starter values
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    const pending = bookingRepo.create({
      user,
      room,
      startTime,
      endTime,
      status: "PENDING",
      expiresAt,
    });

    const saved = await bookingRepo.save(pending);
    return bookingRepo.findOneOrFail({ where: { id: saved.id }, relations: ["room"] });
  }

  static async listForUserPaginated(userId: string, page: number, limit: number) {
    const qb = AppDataSource.getRepository(Booking)
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.room", "room")
      .leftJoinAndSelect("b.user", "user")
      .where("user.id = :uid", { uid: userId })
      .orderBy("b.startTime", "ASC");

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map(b => b.toJSON() ? (b as any).toJSON() : b),
      total,
      page,
      hasMore: skip + rows.length < total,
    };
  }

  static async confirmBooking(bookingId: string, userId: string) {
    const b = await bookingRepo.findOne({
      where: { id: bookingId },
      relations: ["user", "room"],
    });
    if (!b) { const e: any = new Error("Booking not found"); e.status = 404; throw e; }
    if (b.user.id !== userId) { const e: any = new Error("Forbidden"); e.status = 403; throw e; }

    // If already confirmed, just return the hydrated row
    if (b.status !== "PENDING") {
      return bookingRepo.findOneOrFail({ where: { id: b.id }, relations: ["user", "room"] });
    }

    // Hold must still be active
    if (!b.expiresAt || b.expiresAt <= new Date()) {
      const e: any = new Error("Hold expired");
      e.status = 410;
      throw e;
    }

    // Safety: ensure no other confirmed booking overlaps now
    const overlap = await bookingRepo.createQueryBuilder("x")
      .innerJoin("x.room", "room")
      .where("room.id = :roomId", { roomId: b.room.id })
      .andWhere("x.id <> :selfId", { selfId: b.id })
      .andWhere("x.status = 'CONFIRMED'")
      .andWhere("x.startTime < :end AND x.endTime > :start", {
        start: b.startTime,
        end: b.endTime,
      })
      .getOne();

    if (overlap) {
      const e: any = new Error("Room just became unavailable for this range");
      e.status = 409;
      throw e;
    }

    b.status = "CONFIRMED";
    b.expiresAt = null;
    await bookingRepo.save(b);

    // Return the fresh row (still in DB) with relations
    return bookingRepo.findOneOrFail({ where: { id: b.id }, relations: ["user", "room"] });
  }


  // Existing immediate create (kept for completeness)
  static async createBooking(params: {
    userId: string;
    roomId: string;
    startTime: string | Date;
    endTime: string | Date;
  }) {
    const { userId, roomId } = params;
    const startTime = asDate(params.startTime);
    const endTime = asDate(params.endTime);
    if (startTime >= endTime) { const e: any = new Error("Invalid time range"); e.status = 400; throw e; }

    const [room, user] = await Promise.all([
      roomRepo.findOne({ where: { id: roomId } }),
      userRepo.findOne({ where: { id: userId } }),
    ]);
    if (!room) { const e: any = new Error("Room not found"); e.status = 404; throw e; }
    if (!user) { const e: any = new Error("User not found"); e.status = 404; throw e; }

    // only confirmed overlap
    const overlapping = await bookingRepo
      .createQueryBuilder("booking")
      .innerJoin("booking.room", "room")
      .where("room.id = :roomId", { roomId })
      .andWhere("booking.status = 'CONFIRMED'")
      .andWhere("booking.startTime < :endTime", { endTime })
      .andWhere("booking.endTime > :startTime", { startTime })
      .getOne();

    if (overlapping) {
      const e: any = new Error("Room already booked for this time range"); e.status = 409; throw e;
    }

    const toSave = bookingRepo.create({ user, room, startTime, endTime, status: "CONFIRMED", expiresAt: null });
    const saved = await bookingRepo.save(toSave);
    return bookingRepo.findOneOrFail({ where: { id: saved.id }, relations: ["room"] });
  }

  static async cancelBooking(bookingId: string, userId: string) {
    const b = await bookingRepo.findOne({
      where: { id: bookingId },
      relations: ["user", "room"],
    });
    if (!b) { const e: any = new Error("Booking not found"); e.status = 404; throw e; }
    if (b.user.id !== userId) { const e: any = new Error("Forbidden"); e.status = 403; throw e; }
    if (b.status === "CANCELLED") return b;

    const now = new Date();
    // allow cancelling: PENDING anytime; CONFIRMED only before startTime
    if (b.status === "CONFIRMED" && b.startTime <= now) {
      const e: any = new Error("Stay already started; cannot cancel");
      e.status = 422;
      throw e;
    }

    b.status = "CANCELLED";
    b.expiresAt = null;
    await bookingRepo.save(b);
    return b;
  }

  static async releaseExpiredHolds() {
    const now = new Date();

    await bookingRepo
      .createQueryBuilder()
      .update(Booking)
      .set({ status: "CANCELLED", expiresAt: null })
      .where("status = 'PENDING'")
      .andWhere("expiresAt IS NOT NULL")
      .andWhere("expiresAt <= :now", { now })
      .execute();
  }
}
