// src/routes/booking.routes.ts
import { Router } from "express";
import { BookingController } from "../controllers/BookingController";
import { authRequired } from "../middleware/authMiddleware";
// import { cacheGet } from "../middleware/cache";
import { cache, setCacheGroup } from "../middleware/httpCache";

const router = Router();

router.post("/", authRequired, BookingController.create);
router.post("/hold", authRequired, BookingController.hold);
router.post("/:bookingId/confirm", authRequired, BookingController.confirm);
router.post("/:bookingId/cancel", authRequired, BookingController.cancel); // NEW
router.get("/my", setCacheGroup("rooms"), cache("30 seconds"), authRequired, BookingController.myBookings);

export default router;
