// src/entities/Booking.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index
} from "typeorm";
import { User } from "./User";
import { Room } from "./Room";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

@Entity({ name: "bookings" })
@Index(["room", "startTime", "endTime"])
@Index(["user", "startTime"])
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.bookings, { eager: true, nullable: false })
  user!: User;

  @ManyToOne(() => Room, (room) => room.bookings, { eager: true, nullable: false })
  room!: Room;

  @Column({ type: "timestamptz" })
  startTime!: Date;

  @Column({ type: "timestamptz" })
  endTime!: Date;

  @Column({ type: "varchar", default: "CONFIRMED" })
  status!: BookingStatus;

  // NEW: hold expiry (used when status === "PENDING")
  @Column({ type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
      roomId: this.room?.id,
      roomName: (this.room as any)?.name ?? `Room ${this.room?.id}`,
      roomImageUrl: (this.room as any)?.imageUrl ?? null,
    };
  }
}
