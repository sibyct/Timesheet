import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/timesheet",
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
  port: process.env.PORT,
};
