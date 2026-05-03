import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: string;
    role: string;
}

const JWT_EXPIRES_IN = "1d";
const PASSWORD_SALT_ROUNDS = 10;

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return secret;
};

export const generateToken = (userId: string, role: string) => {
    return jwt.sign(
        { userId, role },
        getJwtSecret(),
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
};

export const hashPassword = async (password: string) => {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

export const comparePassword = async (
    plainPassword: string,
    hashedPassword: string
) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};
