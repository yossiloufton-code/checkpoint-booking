import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { hashPassword, comparePassword } from "../utils/password";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const userRepo = AppDataSource.getRepository(User);

export class AuthService {
  static async register(
    name: string,
    email: string,
    password: string,
    role: "GUEST" | "MEMBER" = "MEMBER"
  ) {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      const err: any = new Error("Email already in use");
      err.status = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const user = userRepo.create({ name, email, passwordHash, role });
    await userRepo.save(user);

    const token = this.generateToken(user);
    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  }
}
