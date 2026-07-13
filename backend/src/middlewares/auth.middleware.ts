import { Request, Response, NextFunction } from "express";
import { JwtPayload, verifyToken } from "../utils/functions";
import prisma from "../config/prisma";

export const authMiddleware = async (
    req: Request & { user?: JwtPayload },
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        req.user = {
            userId: user.id,
            role: user.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            status: 0,
            message: "Invalid or expired token",
        });
    }
};
