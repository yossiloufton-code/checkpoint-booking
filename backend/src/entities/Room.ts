// src/entities/Room.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Booking } from "./Booking";

@Entity({ name: "rooms" })
@Index(["location", "name"])
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: "int", default: 1 })
  capacity!: number;

  @Column({ type: "jsonb", nullable: true })
  amenities?: Record<string, any>;

  // NEW: availability window – when this room can be booked
  @Column({ type: "timestamptz", nullable: true })
  availableFrom?: Date; // null = always available from the past

  @Column({ type: "timestamptz", nullable: true })
  availableTo?: Date;   // null = no end limit

  @OneToMany(() => Booking, (booking) => booking.room)
  bookings!: Booking[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
