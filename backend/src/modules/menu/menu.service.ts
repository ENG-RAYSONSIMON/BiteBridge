import prisma from "../../config/prisma";
import { CreateMenuItemInput } from "./menu.types";

export const createMenuItem = async (
  ownerId: string,
  data: CreateMenuItemInput
) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const item = await prisma.menuItem.create({
    data: {
      ...data,
      restaurantId: restaurant.id,
    },
  });

  return item;
};

export const getRestaurantMenu = async (restaurantId: string) => {
  return prisma.menuItem.findMany({
    where: {
      restaurantId,
      isAvailable: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getMyMenu = async (ownerId: string) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  return prisma.menuItem.findMany({
    where: {
      restaurantId: restaurant.id,
    },
  });
};

export const deleteMenuItem = async (ownerId: string, itemId: string) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.restaurantId !== restaurant.id) {
    throw new Error("Not authorized to delete this item");
  }

  await prisma.menuItem.delete({
    where: { id: itemId },
  });

  return { message: "Deleted successfully" };
};