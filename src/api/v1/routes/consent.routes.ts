/**
 * @fileoverview Consent collection routes configuration.
 * @module api/v1/routes
 * @description Routes for managing consent collection flow as per DPDP Act 2023.
 * 
 * Flow:
 * 1. POST /api/v1/consents/initiate - Data Fiduciary initiates consent request
 * 2. GET /consents/:cms_request_id - Data Principal views consent notice (public route)
 * 3. POST /api/v1/consents/submit - Data Principal submits consent
 * 4. GET /api/v1/consents/validate - Validate consent artifact
 * 5. Webhook: POST /webhook/consent - Outbound notification to Data Fiduciary
 */

import { Router } from "express";
import * as ConsentController from "@/modules/consent/controllers/consent.controller";

const router = Router();

/**
 * PUBLIC ROUTES (No authentication required)
 * These are accessed by data principals (end users)
 */

/**
 * Step 1: Initiate consent request
 * POST /api/v1/consents/initiate
 * Body: { data_fiduciary_id, user_id, purposes[], data_fields[], duration?, metadata? }
 */
router.post("/initiate", ConsentController.InitiateConsentController);

/**
 * Step 8: Submit consent
 * POST /api/v1/consents/submit
 * Body: { cms_request_id, selected_purposes[], agree: true }
 */
router.post("/submit", ConsentController.SubmitConsentController);

/**
 * Step 16-18: Validate consent artifact
 * GET /api/v1/consents/validate?artifact_id=xxx&data_fiduciary_id=xxx&purpose_id=xxx
 */
router.get("/validate", ConsentController.ValidateConsentController);

/**
 * Step 5-7: Get consent notice for data principal to view
 * GET /consents/:cms_request_id?language=en
 * Public route - no authentication required
 */
router.get("/:cms_request_id", ConsentController.GetConsentNoticeController);

/**
 * Bulk consent validation
 * POST /api/v1/consents/validate-bulk
 * Body: { data_fiduciary_id, validations: [{ artifact_id, purpose_id? }] }
 */
router.post("/validate-bulk", ConsentController.ValidateBulkConsentsController);

/**
 * Initiate renewal request
 * POST /api/v1/consents/renew
 * Body: { consent_artifact_id (or artifact_id), data_fiduciary_id?, requested_extension? (e.g., "+365d"), extend_by_days?, initiated_by?, purpose_ids? }
 */
router.post("/renew", ConsentController.InitiateRenewalController);

/**
 * FIDUCIARY-SPECIFIC ROUTES
 * These routes are scoped to a specific data fiduciary
 * Path prefix: /api/v1/data-fiduciaries/:data_fiduciary_id/consents
 */

/**
 * List all consents for a data fiduciary with filters
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents
 * Query: status, purpose_id, from_date, to_date, page, limit, sort_by, sort_order
 */
router.get("/:data_fiduciary_id/consents", ConsentController.ListConsentsController);

/**
 * Get specific consent artifact by ID
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id
 */
router.get("/:data_fiduciary_id/consents/:artifact_id", ConsentController.GetConsentByIdController);

/**
 * Get consent history
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/history
 */
router.get("/:data_fiduciary_id/consents/:artifact_id/history", ConsentController.GetConsentHistoryController);

/**
 * Withdraw consent
 * POST /api/v1/:data_fiduciary_id/consents/:artifact_id/withdraw
 * Body: { reason?, notes? }
 */
router.post("/:data_fiduciary_id/consents/:artifact_id/withdraw", ConsentController.WithdrawConsentController);

/**
 * USER-SPECIFIC ROUTES
 * Get all consents for a specific user (by external user ID)
 */

/**
 * Get all consents for a specific user
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/users/:external_user_id/consents
 * Query: status, page, limit
 */
router.get("/:data_fiduciary_id/users/:external_user_id/consents", ConsentController.GetUserConsentsController);

export default router;

