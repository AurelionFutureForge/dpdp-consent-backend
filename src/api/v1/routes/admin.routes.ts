/**
 * @fileoverview Admin routes for CRON job management
 * @module api/v1/routes/admin
 */

import { Router } from 'express';
import {
  triggerExpiryRemindersController,
  triggerExpireConsentsController,
  getCronStatusController,
} from '@/modules/common/controllers/cron.controller';

const router = Router();

/**
 * @route   GET /api/v1/admin/cron/status
 * @desc    Get CRON job status and configuration
 * @access  Admin only
 */
router.get('/cron/status', getCronStatusController);

/**
 * @route   POST /api/v1/admin/cron/trigger-expiry-reminders
 * @desc    Manually trigger consent expiry reminder job
 * @access  Admin only
 */
router.post('/cron/trigger-expiry-reminders', triggerExpiryRemindersController);

/**
 * @route   POST /api/v1/admin/cron/trigger-expire-consents
 * @desc    Manually trigger consent expiration job
 * @access  Admin only
 */
router.post('/cron/trigger-expire-consents', triggerExpireConsentsController);

export default router;
