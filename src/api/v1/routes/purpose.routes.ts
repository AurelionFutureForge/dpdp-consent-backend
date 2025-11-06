/**
 * @fileoverview Purpose routes configuration.
 * @module api/v1/routes
 * @description Routes for managing purposes per data fiduciary.
 */

import { Router } from "express";
import * as PurposeController from "@/modules/purpose/controllers/purpose.controller";

const router = Router();

// Get analytics for all purposes grouped by data fiduciary
router.get("/grouped-by-fiduciary/analytics", PurposeController.GetGroupedPurposesAnalyticsController);

// Get all purposes grouped by data fiduciary with pagination
router.get("/grouped-by-fiduciary", PurposeController.GetPurposesGroupedByFiduciaryController);

// Analytics route (must come before :purpose_id route)
router.get("/:data_fiduciary_id/analytics/summary", PurposeController.GetPurposeAnalyticsController);

// Get purposes grouped by category for a specific fiduciary
router.get("/:data_fiduciary_id/grouped-by-category", PurposeController.GetPurposesGroupedByCategoryController);

// Get all purposes with pagination and filtering
router.get("/:data_fiduciary_id", PurposeController.GetAllPurposesController);

// Create new purpose
router.post("/:data_fiduciary_id", PurposeController.CreatePurposeController);

// Get specific purpose by ID
router.get("/:data_fiduciary_id/:purpose_id", PurposeController.GetPurposeByIdController);

// Update purpose
router.put("/:data_fiduciary_id/:purpose_id", PurposeController.UpdatePurposeController);

// Toggle purpose active status
router.patch("/:data_fiduciary_id/:purpose_id/toggle-status", PurposeController.TogglePurposeStatusController);

// Delete purpose
router.delete("/:data_fiduciary_id/:purpose_id", PurposeController.DeletePurposeController);

export default router;

