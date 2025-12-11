/**
 * @fileoverview CRON Job Controller - Admin endpoints for managing scheduled tasks
 * @module modules/common/controllers/cron
 */

import { Request, Response, NextFunction } from 'express';
import {
  triggerConsentExpiryReminders,
  expireOldConsents,
} from '@/modules/common/services/cron.service';
import logger from '@/modules/common/utils/logger';

/**
 * Manually trigger consent expiry reminder job
 * 
 * @route POST /api/v1/admin/cron/trigger-expiry-reminders
 * @access Admin only
 */
export const triggerExpiryRemindersController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[CRON CONTROLLER] Manually triggering consent expiry reminders');

    const result = await triggerConsentExpiryReminders();

    res.status(200).json({
      status: 'success',
      message: 'Consent expiry reminder job completed',
      data: result,
    });
  } catch (error: any) {
    logger.error('[CRON CONTROLLER] Error triggering expiry reminders:', error);
    next(error);
  }
};

/**
 * Manually trigger consent expiration job
 * 
 * @route POST /api/v1/admin/cron/trigger-expire-consents
 * @access Admin only
 */
export const triggerExpireConsentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[CRON CONTROLLER] Manually triggering consent expiration job');

    await expireOldConsents();

    res.status(200).json({
      status: 'success',
      message: 'Consent expiration job completed successfully',
    });
  } catch (error: any) {
    logger.error('[CRON CONTROLLER] Error triggering consent expiration:', error);
    next(error);
  }
};

/**
 * Get CRON job status and configuration
 * 
 * @route GET /api/v1/admin/cron/status
 * @access Admin only
 */
export const getCronStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cronConfig = {
      timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
      reminderDaysBeforeExpiry: parseInt(
        process.env.CONSENT_EXPIRY_REMINDER_DAYS || '7'
      ),
      jobs: [
        {
          name: 'Consent Expiry Reminders',
          schedule: '0 1 * * *',
          description: 'Send email reminders for expiring consents',
          nextRun: 'Daily at 1:00 AM',
        },
        {
          name: 'Expire Old Consents',
          schedule: '0 2 * * *',
          description: 'Mark expired consents and create history records',
          nextRun: 'Daily at 2:00 AM',
        },
      ],
    };

    res.status(200).json({
      status: 'success',
      message: 'CRON job status retrieved successfully',
      data: cronConfig,
    });
  } catch (error: any) {
    logger.error('[CRON CONTROLLER] Error getting cron status:', error);
    next(error);
  }
};
