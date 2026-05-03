import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { LoginInput, RegisterInput } from "./auth.types";

const generateToken = (userId: string, role: string) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
    );
};

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: data.role || "CUSTOMER",
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
        },
    });

    const token = generateToken(user.id, user.role);

    return { user, token };
};

export const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user.id, user.role);

    return {
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
        },
        token,
    };
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};