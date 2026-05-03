import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import restaurantRoutes from "./modules/restaurants/restaurant.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/orders/order.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: 1,
        message: "Food Ordering API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

export default app;