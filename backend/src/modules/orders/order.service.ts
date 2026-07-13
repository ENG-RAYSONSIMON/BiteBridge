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

export const getAvailableOrders = async () => {
    return prisma.order.findMany({
        where: {
            status: "READY_FOR_PICKUP",
            riderId: null,
        },
        include: {
            items: true,
            restaurant: true,
            customer: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                },
            },
        },
        orderBy: {
            updatedAt: "asc",
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

    if (order.status !== "PENDING") {
        throw new Error("Only pending orders can be accepted");
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

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order || order.restaurantId !== restaurant.id) {
        throw new Error("Not authorized");
    }

    if (order.status !== "ACCEPTED") {
        throw new Error("Only accepted orders can be marked as preparing");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "PREPARING" },
    });
};

export const markReadyForPickup = async (restaurantOwnerId: string, orderId: string) => {
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

    if (order.status !== "PREPARING") {
        throw new Error("Only preparing orders can be marked as ready for pickup");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "READY_FOR_PICKUP" },
    });
};

export const assignRider = async (riderId: string, orderId: string) => {
    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            status: "READY_FOR_PICKUP",
            riderId: null,
        },
        data: {
            riderId,
            status: "OUT_FOR_DELIVERY",
        },
    });

    if (result.count === 0) {
        throw new Error("Order is not available for pickup");
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return order;
};

export const markDelivered = async (riderId: string, orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order || order.riderId !== riderId) {
        throw new Error("Not authorized");
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
        throw new Error("Only out-for-delivery orders can be marked as delivered");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
    });
};
