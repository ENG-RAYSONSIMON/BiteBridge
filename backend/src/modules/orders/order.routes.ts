import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { allowRoles } from "../../middlewares/role.middleware";
import {
    create,
    myOrders,
    available,
    accept,
    prepare,
    ready,
    assign,
    deliver
} from "./order.controller";

const router = Router();

// Customer
router.post("/", authMiddleware, allowRoles("CUSTOMER"), create);
router.get("/my", authMiddleware, allowRoles("CUSTOMER"), myOrders);

// Rider
router.get("/available", authMiddleware, allowRoles("RIDER"), available);
router.patch("/:id/assign", authMiddleware, allowRoles("RIDER"), assign);
router.patch("/:id/deliver", authMiddleware, allowRoles("RIDER"), deliver);

// Restaurant
router.patch("/:id/accept", authMiddleware, allowRoles("RESTAURANT"), accept);
router.patch("/:id/prepare", authMiddleware, allowRoles("RESTAURANT"), prepare);
router.patch("/:id/ready", authMiddleware, allowRoles("RESTAURANT"), ready);

export default router;
