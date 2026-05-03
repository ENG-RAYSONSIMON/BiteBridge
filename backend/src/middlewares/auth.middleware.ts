import { Request, Response, NextFunction } from "express";
import { JwtPayload, verifyToken } from "../utils/functions";

export const authMiddleware = (
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

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            status: 0,
            message: "Invalid or expired token",
        });
    }
};
