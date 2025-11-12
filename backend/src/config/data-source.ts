import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../entities/User";
import { Room } from "../entities/Room";
import { Booking } from "../entities/Booking";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  entities: [User, Room, Booking],
  synchronize: true, 
  logging: env.NODE_ENV === "development"
});
