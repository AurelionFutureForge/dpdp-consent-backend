import { Router } from "express";
import { AuthController } from "@/modules/auth";

const router = Router();

router.post("/login", AuthController.LoginController);
router.post("/verify-otp", AuthController.VerifyOTPController);
router.post("/refresh-token", AuthController.RefreshTokenController);

export default router;
