import { existsSync } from "fs";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export interface AppConfig {
  port: number;
  mongoUri: string;
}

const DEFAULT_PORT: number = 3000;
const DEFAULT_MONGO_URI: string = "mongodb://127.0.0.1:27017/campushub";

export const config: AppConfig = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  mongoUri: process.env.MONGODB_URI ?? DEFAULT_MONGO_URI,
};
