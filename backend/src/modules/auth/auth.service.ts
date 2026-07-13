import prisma from "../../config/prisma";
import { comparePassword, generateToken, hashPassword } from "../../utils/functions";
import {
    LoginInput,
    RegisterInput,
    SelfAssignableRole,
    UpdateRoleInput,
} from "./auth.types";

const SELF_ASSIGNABLE_ROLES: SelfAssignableRole[] = [
    "CUSTOMER",
    "RESTAURANT",
    "RIDER",
];

export const registerUser = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
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

    const isPasswordValid = await comparePassword(data.password, user.password);

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

export const updateCurrentUserRole = async (
    userId: string,
    data: UpdateRoleInput
) => {
    if (!SELF_ASSIGNABLE_ROLES.includes(data.role)) {
        throw new Error("Invalid role");
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: { role: data.role },
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
