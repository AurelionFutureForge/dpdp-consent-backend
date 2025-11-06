/**
 * @fileoverview Purpose Category routes configuration.
 * @module api/v1/routes
 * @description Routes for managing purpose categories per data fiduciary.
 */

import { Router } from "express";
import { PurposeCategoryController } from "@/modules/purpose";

const router = Router();

// Get analytics for all categories grouped by data fiduciary
router.get("/grouped-by-fiduciary/analytics", PurposeCategoryController.GetGroupedCategoriesAnalyticsController);

// Get all categories grouped by data fiduciary with pagination
router.get("/grouped-by-fiduciary", PurposeCategoryController.GetPurposeCategoriesGroupedByFiduciaryController);

// Analytics route (must come before :purpose_category_id route)
router.get("/:data_fiduciary_id/analytics/summary", PurposeCategoryController.GetPurposeCategoryAnalyticsController);

// Get all purpose categories with pagination and filtering
router.get("/:data_fiduciary_id", PurposeCategoryController.GetAllPurposeCategoriesController);

// Create new purpose category
router.post("/:data_fiduciary_id", PurposeCategoryController.CreatePurposeCategoryController);

// Get specific purpose category by ID
router.get("/:data_fiduciary_id/:purpose_category_id", PurposeCategoryController.GetPurposeCategoryByIdController);

// Update purpose category
router.put("/:data_fiduciary_id/:purpose_category_id", PurposeCategoryController.UpdatePurposeCategoryController);

// Toggle purpose category active status
router.patch("/:data_fiduciary_id/:purpose_category_id/toggle-status", PurposeCategoryController.TogglePurposeCategoryStatusController);

// Delete purpose category
router.delete("/:data_fiduciary_id/:purpose_category_id", PurposeCategoryController.DeletePurposeCategoryController);

export default router;