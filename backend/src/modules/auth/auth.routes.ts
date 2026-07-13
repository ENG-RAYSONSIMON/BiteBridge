import { Router } from "express";
import { login, me, register, updateMyRole } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { allowRoles } from "../../middlewares/role.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, me);
router.patch("/me/role", authMiddleware, updateMyRole);

// Test RBAC routes
router.get(
    "/admin-only",
    authMiddleware,
    allowRoles("ADMIN"),
    (req, res) => {
        res.json({
            status: 1,
            message: "Welcome admin",
        });
    }
);

router.get(
    "/restaurant-only",
    authMiddleware,
    allowRoles("RESTAURANT"),
    (req, res) => {
        res.json({
            status: 1,
            message: "Welcome restaurant user",
        });
    }
);

router.get(
    "/rider-only",
    authMiddleware,
    allowRoles("RIDER"),
    (req, res) => {
        res.json({
            status: 1,
            message: "Welcome rider",
        });
    }
);

export default router;
