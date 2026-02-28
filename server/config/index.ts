import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/timesheetDb",
  jwtSecret: process.env.JWT_SECRET || "timesheet_jwt_secret_key",
  port: process.env.PORT || 4000,
};
