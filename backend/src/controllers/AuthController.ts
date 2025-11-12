// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;
      const result = await AuthService.register(
        name,
        email,
        password,
        role === "GUEST" ? "GUEST" : "MEMBER"
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // NEW: guest login
  static async guest(_req: Request, res: Response, next: NextFunction) {
    try {
      const randomId = Math.random().toString(36).substring(2, 10);
      const guestEmail = `guest_${randomId}@guest.local`;
      const guestName = `Guest ${randomId}`;

      const result = await AuthService.register(
        guestName,
        guestEmail,
        "guest1234", // dummy password
        "GUEST"
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  // already mentioned: /auth/currentUser
  static async currentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const anyReq = req as any;
      const user = anyReq.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      });
    } catch (err) {
      next(err);
    }
  }
}
