import { Router } from "express";
import authRoutes from "./auth.routes";
import roomRoutes from "./room.routes";
import bookingRoutes from "./booking.routes";
import { authLimiter, roomsLimiter, bookingsLimiter } from "../middleware/rateLimiter";

const router = Router();

// Stricter on auth
router.use("/auth", authLimiter, authRoutes);

// Moderate on rooms search/list
router.use("/rooms", roomsLimiter, roomRoutes);

// Stricter on bookings mutations
router.use("/bookings", bookingsLimiter, bookingRoutes);

export default router;
