/**
 * @fileoverview CRON Job Service - Scheduled Tasks
 * @module modules/common/services/cron
 * 
 * @description
 * This service handles all scheduled tasks:
 * - Consent expiry reminders (daily at 1 AM)
 * - Other scheduled maintenance tasks
 */

import cron from 'node-cron';
import prisma from 'prisma/client/prismaClient';
import logger from '@/modules/common/utils/logger';
import { sendNotification } from '@/modules/notification/services/notification.service';

/**
 * Days before expiry to send reminder
 * Configurable via environment variable
 */
const REMINDER_DAYS_BEFORE_EXPIRY = parseInt(
  process.env.CONSENT_EXPIRY_REMINDER_DAYS || '7'
);

/**
 * Send consent expiry reminders
 * Runs daily at 1 AM to check for expiring consents
 */
export const sendConsentExpiryReminders = async (): Promise<void> => {
  const startTime = Date.now();
  
  try {
    logger.info('🔔 [CRON] Starting consent expiry reminder job');

    // Calculate the date range for expiring consents
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + REMINDER_DAYS_BEFORE_EXPIRY);

    // Set to end of the reminder day (23:59:59)
    reminderDate.setHours(23, 59, 59, 999);

    // Query consents that are:
    // 1. ACTIVE status
    // 2. Have expires_at date within the next N days
    // 3. Not deleted
    const expiringConsents = await prisma.consentArtifact.findMany({
      where: {
        status: 'ACTIVE',
        expires_at: {
          gte: today,
          lte: reminderDate,
        },
        is_deleted: false,
      },
      include: {
        principal: {
          select: {
            data_principal_id: true,
            email: true,
            phone: true,
            language: true,
            external_id: true,
          },
        },
        fiduciary: {
          select: {
            name: true,
            logo_url: true,
          },
        },
        purpose_version: {
          include: {
            purpose: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    logger.info(`📊 [CRON] Found ${expiringConsents.length} consents expiring within ${REMINDER_DAYS_BEFORE_EXPIRY} days`);

    if (expiringConsents.length === 0) {
      logger.info('✅ [CRON] No expiring consents found. Job completed.');
      return;
    }

    // Send reminders for each expiring consent
    let successCount = 0;
    let failureCount = 0;

    for (const consent of expiringConsents) {
      try {
        // Skip if principal has no email (cannot send reminder)
        if (!consent.principal.email) {
          logger.warn(`⚠️ [CRON] Skipping consent ${consent.consent_artifact_id}: No email for principal ${consent.principal.data_principal_id}`);
          failureCount++;
          continue;
        }

        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil(
          (new Date(consent.expires_at!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send notification
        const result = await sendNotification({
          user_id: consent.principal.data_principal_id,
          notification_type: 'consent_renewal_reminder',
          channels: ['EMAIL'],
          metadata: {
            artifact_id: consent.consent_artifact_id,
            fiduciary_name: consent.fiduciary.name,
            fiduciary_logo: consent.fiduciary.logo_url || undefined,
            purpose_titles: [consent.purpose_version.purpose.title],
            expires_at: consent.expires_at!,
            external_id: consent.principal.external_id || undefined,
          },
          language: consent.principal.language,
        });

        if (result.success) {
          successCount++;
          logger.info(`✅ [CRON] Sent reminder for consent ${consent.consent_artifact_id} (expires in ${daysUntilExpiry} days)`);
        } else {
          failureCount++;
          logger.error(`❌ [CRON] Failed to send reminder for consent ${consent.consent_artifact_id}: ${result.message}`);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        failureCount++;
        logger.error(`❌ [CRON] Error processing consent ${consent.consent_artifact_id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `✅ [CRON] Consent expiry reminder job completed in ${duration}ms\n` +
      `   Total: ${expiringConsents.length} | Success: ${successCount} | Failed: ${failureCount}`
    );
  } catch (error: any) {
    logger.error('❌ [CRON] Error in consent expiry reminder job:', error);
    throw error;
  }
};

/**
 * Expire old consents
 * Runs daily to mark expired consents
 */
export const expireOldConsents = async (): Promise<void> => {
  try {
    logger.info('⏰ [CRON] Starting consent expiration job');

    const today = new Date();

    // Update consents that have passed their expiry date
    const result = await prisma.consentArtifact.updateMany({
      where: {
        status: 'ACTIVE',
        expires_at: {
          lt: today,
        },
        is_deleted: false,
      },
      data: {
        status: 'EXPIRED',
        updated_at: today,
      },
    });

    logger.info(`✅ [CRON] Expired ${result.count} consents`);

    // Create history records for expired consents
    if (result.count > 0) {
      const expiredConsents = await prisma.consentArtifact.findMany({
        where: {
          status: 'EXPIRED',
          expires_at: {
            lt: today,
          },
          updated_at: {
            gte: new Date(today.getTime() - 60000), // Last minute
          },
        },
        select: {
          consent_artifact_id: true,
          data_principal_id: true,
          fiduciary: {
            select: {
              name: true,
            },
          },
          purpose_version: {
            include: {
              purpose: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      // Create consent history entries
      for (const consent of expiredConsents) {
        await prisma.consentHistory.create({
          data: {
            consent_artifact_id: consent.consent_artifact_id,
            action: 'EXPIRE',
            previous_status: 'ACTIVE',
            new_status: 'EXPIRED',
            performed_by: 'system',
            performed_by_type: 'system',
            notes: 'Automatically expired by system',
          },
        });

        // Send expiry notification
        try {
          await sendNotification({
            user_id: consent.data_principal_id,
            notification_type: 'consent_expired',
            channels: ['EMAIL'],
            metadata: {
              artifact_id: consent.consent_artifact_id,
              fiduciary_name: consent.fiduciary.name,
              purpose_titles: [consent.purpose_version.purpose.title],
            },
          });
        } catch (error) {
          logger.error(`Failed to send expiry notification for ${consent.consent_artifact_id}:`, error);
        }
      }

      logger.info(`✅ [CRON] Created history records for ${expiredConsents.length} expired consents`);
    }
  } catch (error: any) {
    logger.error('❌ [CRON] Error in consent expiration job:', error);
    throw error;
  }
};

/**
 * Initialize all CRON jobs
 */
export const initializeCronJobs = (): void => {
  logger.info('🕐 [CRON] Initializing scheduled jobs...');

  // Job 1: Send consent expiry reminders - Daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('🔔 [CRON] Executing consent expiry reminder job (scheduled: 1:00 AM)');
    try {
      await sendConsentExpiryReminders();
    } catch (error) {
      logger.error('❌ [CRON] Consent expiry reminder job failed:', error);
    }
  }, {
    timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  });

  // Job 2: Expire old consents - Daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('⏰ [CRON] Executing consent expiration job (scheduled: 2:00 AM)');
    try {
      await expireOldConsents();
    } catch (error) {
      logger.error('❌ [CRON] Consent expiration job failed:', error);
    }
  }, {
    timezone: process.env.CRON_TIMEZONE || 'Asia/Kolkata',
  });

  logger.info('✅ [CRON] All scheduled jobs initialized successfully');
  logger.info('   📅 Consent expiry reminders: Daily at 1:00 AM');
  logger.info('   📅 Consent expiration check: Daily at 2:00 AM');
  logger.info(`   🌍 Timezone: ${process.env.CRON_TIMEZONE || 'Asia/Kolkata'}`);
  logger.info(`   ⏱️  Reminder period: ${REMINDER_DAYS_BEFORE_EXPIRY} days before expiry`);
};

/**
 * Manually trigger consent expiry reminder job (for testing)
 */
export const triggerConsentExpiryReminders = async (): Promise<{
  success: boolean;
  message: string;
  stats?: {
    total: number;
    success: number;
    failed: number;
    duration: number;
  };
}> => {
  try {
    const startTime = Date.now();
    await sendConsentExpiryReminders();
    const duration = Date.now() - startTime;

    return {
      success: true,
      message: 'Consent expiry reminders sent successfully',
      stats: {
        total: 0, // Would need to track this
        success: 0,
        failed: 0,
        duration,
      },
    };
  } catch (error: any) {
    logger.error('Error triggering consent expiry reminders:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};
