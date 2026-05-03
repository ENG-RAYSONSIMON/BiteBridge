import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { allowRoles } from "../../middlewares/role.middleware";
import {
    create,
    myOrders,
    accept,
    prepare,
    assign,
    deliver
} from "./order.controller";

const router = Router();

// Customer
router.post("/", authMiddleware, allowRoles("CUSTOMER"), create);
router.get("/my", authMiddleware, allowRoles("CUSTOMER"), myOrders);

// Restaurant
router.patch("/:id/accept", authMiddleware, allowRoles("RESTAURANT"), accept);
router.patch("/:id/prepare", authMiddleware, allowRoles("RESTAURANT"), prepare);

// Rider
router.patch("/:id/assign", authMiddleware, allowRoles("RIDER"), assign);
router.patch("/:id/deliver", authMiddleware, allowRoles("RIDER"), deliver);

export default router;