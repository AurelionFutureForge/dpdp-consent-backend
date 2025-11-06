import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import purposeCategoryRoutes from "./routes/purpose-category.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/purpose-categories", purposeCategoryRoutes);

export default router;