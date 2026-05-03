import prisma from "../../config/prisma";
import { CreateOrderInput } from "./order.types";

export const createOrder = async (
    customerId: string,
    data: CreateOrderInput
) => {
    if (!data.items || data.items.length === 0) {
        throw new Error("Order must contain items");
    }

    // Get menu items from DB
    const menuItems = await prisma.menuItem.findMany({
        where: {
            id: {
                in: data.items.map((i) => i.menuItemId),
            },
        },
    });

    if (menuItems.length !== data.items.length) {
        throw new Error("Some menu items not found");
    }

    // Ensure all items belong to same restaurant
    const restaurantId = menuItems[0].restaurantId;

    const sameRestaurant = menuItems.every(
        (item) => item.restaurantId === restaurantId
    );

    if (!sameRestaurant) {
        throw new Error("All items must be from the same restaurant");
    }

    // Calculate total
    let totalAmount = 0;

    const orderItemsData = data.items.map((item) => {
        const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;

        const itemTotal = menuItem.price * item.quantity;

        totalAmount += itemTotal;

        return {
            menuItemId: menuItem.id,
            quantity: item.quantity,
            price: menuItem.price,
        };
    });

    // Create order with items
    const order = await prisma.order.create({
        data: {
            customerId,
            restaurantId,
            totalAmount,
            items: {
                create: orderItemsData,
            },
        },
        include: {
            items: true,
        },
    });

    return order;
};

export const getMyOrders = async (customerId: string) => {
    return prisma.order.findMany({
        where: { customerId },
        include: {
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const acceptOrder = async (restaurantOwnerId: string, orderId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: restaurantOwnerId },
    });

    if (!restaurant) throw new Error("Restaurant not found");

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order || order.restaurantId !== restaurant.id) {
        throw new Error("Not authorized");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "ACCEPTED" },
    });
};

export const startPreparing = async (restaurantOwnerId: string, orderId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: restaurantOwnerId },
    });

    if (!restaurant) throw new Error("Restaurant not found");

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "PREPARING" },
    });
};


export const assignRider = async (riderId: string, orderId: string) => {
    return prisma.order.update({
        where: { id: orderId },
        data: {
            riderId,
            status: "OUT_FOR_DELIVERY",
        },
    });
};

export const markDelivered = async (riderId: string, orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order || order.riderId !== riderId) {
        throw new Error("Not authorized");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
    });
};

