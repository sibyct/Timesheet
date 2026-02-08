import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByUsername, createUser } from "./auth.model";

export const registerUser = async (
    employeeId: number,
    username: string,
    password: string
) => {
    const hash = await bcrypt.hash(password, 10);
    return createUser(employeeId, username, hash);
};

export const loginUser = async (username: string, password: string) => {
    const user = await findUserByUsername(username);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;

    const token = jwt.sign(
        { id: user.user_id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d", algorithm: "RS256" }
    );

    return { user, token };
};