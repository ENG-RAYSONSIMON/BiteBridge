import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { allowRoles } from "../../middlewares/role.middleware";
import {
    create,
    myMenu,
    remove,
    restaurantMenu,
} from "./menu.controller";

const router = Router();

// Public
router.get("/restaurant/:restaurantId", restaurantMenu);

// Restaurant owner
router.post(
    "/",
    authMiddleware,
    allowRoles("RESTAURANT"),
    create
);

router.get(
    "/my",
    authMiddleware,
    allowRoles("RESTAURANT"),
    myMenu
);

router.delete(
    "/:id",
    authMiddleware,
    allowRoles("RESTAURANT"),
    remove
);

export default router;