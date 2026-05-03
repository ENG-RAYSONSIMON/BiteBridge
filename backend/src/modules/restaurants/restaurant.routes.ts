import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { allowRoles } from "../../middlewares/role.middleware";
import { create, listRestaurants, myRestaurant } from "./restaurant.controller";

const router = Router();

router.get("/", listRestaurants);

router.post(
    "/",
    authMiddleware,
    allowRoles("RESTAURANT"),
    create
);

router.get(
    "/me",
    authMiddleware,
    allowRoles("RESTAURANT"),
    myRestaurant
);

export default router;