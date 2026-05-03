import { Request, Response } from "express";
import {
    createMenuItem,
    deleteMenuItem,
    getMyMenu,
    getRestaurantMenu,
} from "./menu.service";

export const create = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;

        const item = await createMenuItem(ownerId!, req.body);

        res.status(201).json({
            status: 1,
            message: "Menu item created",
            data: item,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const myMenu = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;

        const items = await getMyMenu(ownerId!);

        res.json({
            status: 1,
            data: items,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const restaurantMenu = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;

        if (!restaurantId) {
            return res.status(400).json({
                status: 0,
                message: "restaurantId is required",
            });
        }

        const items = await getRestaurantMenu(restaurantId as string);

        res.json({
            status: 1,
            data: items,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;
        const { id } = req.params;

        if (!ownerId) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Menu item id is required",
            });
        }

        const result = await deleteMenuItem(ownerId, id as string);

        res.json({
            status: 1,
            message: result.message,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};