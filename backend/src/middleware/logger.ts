import morgan from "morgan";
import { env } from "../config/env";

export const httpLogger = morgan(
  env.NODE_ENV === "development" ? "dev" : "combined"
);
