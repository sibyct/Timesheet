import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userSchema from "./auth.model";
import { AppError } from "../../errors/app.error";
import { STATUS_CODES } from "../../constants/statuscodes";

export const registerUser = async (
  emailAddress: string,
  password: string,
  firstName: string,
  lastName: string,
) => {
  const existingUser = await userSchema
    .findOne({ emailAddress: emailAddress })
    .exec();
  if (existingUser) {
    throw new AppError("Email already in use", STATUS_CODES.CONFLICT);
  }
  const hash = await bcrypt.hash(password, 10);
  return userSchema.create({
    emailAddress,
    password: hash,
    firstName,
    lastName,
  });
};

export const loginUser = async (emailAddress: string, password: string) => {
  const user = await userSchema.findOne({ emailAddress: emailAddress }).exec();
  if (!user) {
    throw new AppError("Invalid credentials", STATUS_CODES.UNAUTHORIZED);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", STATUS_CODES.UNAUTHORIZED);
  }

  const token = jwt.sign(
    { id: user.userId, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d", algorithm: "RS256" },
  );

  return { user, token };
};
