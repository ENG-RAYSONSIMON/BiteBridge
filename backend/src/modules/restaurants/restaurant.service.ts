import prisma from "../../config/prisma";
import { CreateRestaurantInput } from "./restaurant.types";

export const createRestaurant = async (
    ownerId: string,
    data: CreateRestaurantInput
) => {
    const existingRestaurant = await prisma.restaurant.findUnique({
        where: { ownerId },
    });

    if (existingRestaurant) {
        throw new Error("You already have a restaurant");
    }

    const restaurant = await prisma.restaurant.create({
        data: {
            ownerId,
            name: data.name,
            description: data.description,
            address: data.address,
            phone: data.phone,
        },
    });

    return restaurant;
};

export const getMyRestaurant = async (ownerId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId },
    });

    if (!restaurant) {
        throw new Error("Restaurant not found");
    }

    return restaurant;
};

export const getAllRestaurants = async () => {
    return prisma.restaurant.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
};