import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userSchema from "./auth.model";

export const registerUser = async (emailAddress: string, password: string) => {
  const existingUser = await userSchema
    .findOne({ emailAddress: emailAddress })
    .exec();
  if (existingUser) {
    throw new Error("Email already in use");
  }
  const hash = await bcrypt.hash(password, 10);
  return userSchema.create({ emailAddress, password: hash });
};

export const loginUser = async (emailAddress: string, password: string) => {
  const user = await userSchema.findOne({ emailAddress: emailAddress }).exec();
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  const token = jwt.sign(
    { id: user.userId, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d", algorithm: "RS256" },
  );

  return { user, token };
};
