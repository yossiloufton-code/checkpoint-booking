// src/middlewares/authRequired.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

export interface AuthRequest extends Request {
  user?: {
    role: "GUEST" | "MEMBER"; id: string; email: string 
};
}

export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
    };

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    (req as any).user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
