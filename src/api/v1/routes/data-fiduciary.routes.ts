import { Router } from "express";
import { DataFiduciaryController } from "@/modules/data-fiduciary";

const router = Router();

// Data Fiduciary Registration
router.post("/register", DataFiduciaryController.RegisterDataFiduciaryController);

// Data Fiduciary Approval (Admin)
router.post("/approve", DataFiduciaryController.ApproveDataFiduciaryController);

// Admin Routes - Data Fiduciary Review Management
router.get("/review/analytics", DataFiduciaryController.GetDataFiduciaryInReviewAnalyticsController);

// Get all data fiduciaries in review with pagination and filtering
router.get("/review", DataFiduciaryController.GetAllDataFiduciariesInReviewController);

// Data Fiduciary Profile
router.get("/:data_fiduciary_id", DataFiduciaryController.GetDataFiduciaryByIdController);

// Webhook Management
router.post("/webhook", DataFiduciaryController.CreateWebhookController);
router.get("/webhook/:data_fiduciary_id", DataFiduciaryController.GetWebhookController);
router.get("/webhook/:data_fiduciary_id/logs", DataFiduciaryController.GetWebhookLogsController);

export default router;