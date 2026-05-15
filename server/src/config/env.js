import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  sqlitePath: process.env.SQLITE_PATH,
  jwtSecret: process.env.JWT_SECRET || "mentorflow-dev-secret-change-me",
  clientOrigin: process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development"
};
