import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import purposeCategoryRoutes from "./routes/purpose-category.routes";
import purposeRoutes from "./routes/purpose.routes";
import consentRoutes from "./routes/consent.routes";
import adminRoutes from "./routes/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/purpose-categories", purposeCategoryRoutes);
router.use("/purposes", purposeRoutes);
router.use("/consents", consentRoutes);
router.use("/admin", adminRoutes);

export default router;