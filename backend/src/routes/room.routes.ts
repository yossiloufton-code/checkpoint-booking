import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
// import { cacheGet } from "../middleware/cache";
import { cache, setCacheGroup } from "../middleware/httpCache";

const router = Router();

router.get("/", setCacheGroup("rooms"), cache("30 seconds"), RoomController.list);
router.get("/:id", setCacheGroup("rooms"), cache("30 seconds"), RoomController.getOne);

export default router;
