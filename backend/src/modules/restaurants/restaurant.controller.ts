import { Request, Response } from "express";
import {
    createRestaurant,
    getAllRestaurants,
    getMyRestaurant,
} from "./restaurant.service";

export const create = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;

        if (!ownerId) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        const restaurant = await createRestaurant(ownerId, req.body);

        res.status(201).json({
            status: 1,
            message: "Restaurant created successfully",
            data: restaurant,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const myRestaurant = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;

        if (!ownerId) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        const restaurant = await getMyRestaurant(ownerId);

        res.status(200).json({
            status: 1,
            message: "Restaurant fetched successfully",
            data: restaurant,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const listRestaurants = async (req: Request, res: Response) => {
    try {
        const restaurants = await getAllRestaurants();

        res.status(200).json({
            status: 1,
            message: "Restaurants fetched successfully",
            data: restaurants,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};