import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authRequired } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/guest", AuthController.guest); 
router.get("/currentUser", authRequired, AuthController.currentUser);

export default router;
