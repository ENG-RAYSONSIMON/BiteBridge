import { Request, Response } from "express";
import { acceptOrder, assignRider, createOrder, getMyOrders, markDelivered, startPreparing } from "./order.service";

export const create = async (req: Request, res: Response) => {
    try {
        const customerId = req.user?.userId;

        if (!customerId) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized",
            });
        }

        const order = await createOrder(customerId, req.body);

        res.status(201).json({
            status: 1,
            message: "Order placed successfully",
            data: order,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const myOrders = async (req: Request, res: Response) => {
    try {
        const customerId = req.user?.userId;

        const orders = await getMyOrders(customerId!);

        res.json({
            status: 1,
            data: orders,
        });
    } catch (error: any) {
        res.status(400).json({
            status: 0,
            message: error.message,
        });
    }
};

export const accept = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;
        const { id } = req.params;

        const order = await acceptOrder(ownerId!, id as string);

        res.json({ status: 1, data: order });
    } catch (error: any) {
        res.status(400).json({ status: 0, message: error.message });
    }
};

export const prepare = async (req: Request, res: Response) => {
    try {
        const ownerId = req.user?.userId;
        const { id } = req.params;

        const order = await startPreparing(ownerId!, id as string);

        res.json({ status: 1, data: order });
    } catch (error: any) {
        res.status(400).json({ status: 0, message: error.message });
    }
};

export const assign = async (req: Request, res: Response) => {
    try {
        const riderId = req.user?.userId;
        const { id } = req.params;

        const order = await assignRider(riderId!, id as string);

        res.json({ status: 1, data: order });
    } catch (error: any) {
        res.status(400).json({ status: 0, message: error.message });
    }
};

export const deliver = async (req: Request, res: Response) => {
    try {
        const riderId = req.user?.userId;
        const { id } = req.params;

        const order = await markDelivered(riderId!, id as string);

        res.json({ status: 1, data: order });
    } catch (error: any) {
        res.status(400).json({ status: 0, message: error.message });
    }
};