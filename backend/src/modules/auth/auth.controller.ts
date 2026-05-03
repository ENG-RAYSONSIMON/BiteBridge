import { Request, Response } from "express";
import { loginUser, registerUser, getCurrentUser } from "./auth.service";

export const register = async (req: Request, res: Response) => {
    try {
        const result = await registerUser(req.body);

        res.status(201).json({
            status: 1,
            message: "User registered successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const result = await loginUser(req.body);

        res.status(200).json({
            status: 1,
            message: "Login successful",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        const user = await getCurrentUser(userId);

        res.status(200).json({
            status: 1,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};