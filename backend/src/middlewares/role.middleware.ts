import { Request, Response, NextFunction } from "express";

export const allowRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                status: 0,
                message: "Forbidden: You do not have permission to access this resource",
            });
        }

        next();
    };
};