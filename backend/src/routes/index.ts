import { Router } from "express";
import authRoutes from "./auth.routes";
import roomRoutes from "./room.routes";
import bookingRoutes from "./booking.routes";
import { authLimiter, roomsLimiter, bookingsLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use("/auth", authLimiter, authRoutes);

router.use("/rooms", roomsLimiter, roomRoutes);

router.use("/bookings", bookingsLimiter, bookingRoutes);

export default router;
