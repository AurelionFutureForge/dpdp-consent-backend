/**
 * @fileoverview Notification Service - PII-Free Implementation
 * @module modules/notification/services
 * 
 * @description
 * This service sends notifications to users WITHOUT storing PII in logs.
 * 
 * KEY PRINCIPLE:
 * - Audit logs store only `user_id` (UUID reference) - NO PII
 * - User contact details (email/phone) fetched from DataPrincipal table
 * - Notifications sent via external services (SendGrid/Twilio)
 * - Only notification event logged (not email/phone content)
 */

import prisma from "prisma/client/prismaClient";
import logger from "@/modules/common/utils/logger";
import crypto from "crypto";

/**
 * Notification Types
 */
export type NotificationType = 
  | 'consent_granted'
  | 'consent_withdrawn'
  | 'consent_expired'
  | 'consent_renewal_reminder'
  | 'consent_updated'
  | 'consent_renewed';

/**
 * Notification Channels
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

/**
 * Notification Input (PII-FREE)
 */
export interface SendNotificationInput {
  user_id: string; // UUID reference only - NO EMAIL/PHONE
  notification_type: NotificationType;
  channels: NotificationChannel[];
  metadata?: {
    artifact_id?: string;
    fiduciary_name?: string;
    purpose_titles?: string[];
    expires_at?: Date;
    action_url?: string;
  };
  language?: string;
}

/**
 * Notification Response
 */
export interface NotificationResult {
  success: boolean;
  notification_id: string;
  channels_sent: NotificationChannel[];
  channels_failed: NotificationChannel[];
  message: string;
}

/**
 * Send notification to user (PII-FREE implementation)
 * 
 * @param input - Notification input (only user_id, no email/phone)
 * @returns Notification result
 * 
 * @example
 * await sendNotification({
 *   user_id: "uuid-123",  // ✅ Only UUID reference
 *   notification_type: 'consent_granted',
 *   channels: ['EMAIL', 'SMS'],
 *   metadata: {
 *     artifact_id: "artifact-456",
 *     fiduciary_name: "Trust Bank"
 *   }
 * });
 */
export const sendNotification = async (
  input: SendNotificationInput
): Promise<NotificationResult> => {
  const startTime = Date.now();
  const notification_id = crypto.randomUUID();

  try {
    // Step 1: Fetch user contact info from DataPrincipal table
    // ⚠️ This is the ONLY place where we access PII
    const principal = await prisma.dataPrincipal.findUnique({
      where: { data_principal_id: input.user_id },
      select: {
        data_principal_id: true,
        email: true,
        phone: true,
        language: true,
        external_id: true, // For display purposes only
      },
    });

    if (!principal) {
      logger.warn(`[NOTIFICATION] User not found: ${input.user_id}`);
      return {
        success: false,
        notification_id,
        channels_sent: [],
        channels_failed: input.channels,
        message: "User not found",
      };
    }

    // Step 2: Build notification content (based on type)
    const content = buildNotificationContent(
      input.notification_type,
      input.metadata || {},
      input.language || principal.language || "en"
    );

    // Step 3: Send notifications through each channel
    const results = await Promise.allSettled(
      input.channels.map(async (channel) => {
        switch (channel) {
          case 'EMAIL':
            if (!principal.email) {
              throw new Error("Email not available");
            }
            return await sendEmailNotification(
              principal.email,
              content.subject,
              content.body,
              content.html
            );

          case 'SMS':
            if (!principal.phone) {
              throw new Error("Phone not available");
            }
            return await sendSMSNotification(
              principal.phone,
              content.sms_text
            );

          case 'PUSH':
            return await sendPushNotification(
              input.user_id,
              content.push_title,
              content.push_body
            );

          default:
            throw new Error(`Unsupported channel: ${channel}`);
        }
      })
    );

    // Step 4: Process results
    const channels_sent: NotificationChannel[] = [];
    const channels_failed: NotificationChannel[] = [];

    results.forEach((result, index) => {
      const channel = input.channels[index];
      if (result.status === 'fulfilled') {
        channels_sent.push(channel);
      } else {
        channels_failed.push(channel);
        logger.error(`[NOTIFICATION] ${channel} failed for user ${input.user_id}: ${result.reason}`);
      }
    });

    // Step 5: Log notification event (PII-FREE)
    // ✅ IMPORTANT: We only log the EVENT, not email/phone/name
    await prisma.notification.create({
      data: {
        notification_id,
        user_id: input.user_id, // ✅ Only UUID reference
        notification_type: input.notification_type,
        channels: channels_sent.join(','),
        status: channels_sent.length > 0 ? 'SENT' : 'FAILED',
        sent_at: new Date(),
        metadata: {
          artifact_id: input.metadata?.artifact_id,
          channels_sent,
          channels_failed,
          response_time_ms: Date.now() - startTime,
          // ❌ NO email, phone, or name stored here
        },
      },
    });

    // Step 6: Create audit log (PII-FREE)
    await prisma.auditLog.create({
      data: {
        user_id: input.user_id, // ✅ Only UUID reference
        consent_artifact_id: input.metadata?.artifact_id,
        action: "NOTIFY",
        consent_status: null,
        initiator: "SYSTEM",
        audit_hash: generateAuditHash({
          action: "NOTIFY",
          user_id: input.user_id,
          notification_type: input.notification_type,
          timestamp: new Date(),
        }),
        details: {
          notification_id,
          notification_type: input.notification_type,
          channels_sent,
          channels_failed,
          // ❌ NO email, phone, or name stored in audit log
        },
      },
    });

    logger.info(`[NOTIFICATION] Sent to user ${input.user_id}: ${channels_sent.join(', ')}`);

    return {
      success: channels_sent.length > 0,
      notification_id,
      channels_sent,
      channels_failed,
      message: channels_sent.length > 0 
        ? `Notification sent via ${channels_sent.join(', ')}`
        : 'All notification channels failed',
    };
  } catch (error: any) {
    logger.error(`[NOTIFICATION] Error sending notification to ${input.user_id}:`, error);
    
    // Log failure (PII-FREE)
    await prisma.notification.create({
      data: {
        notification_id,
        user_id: input.user_id,
        notification_type: input.notification_type,
        channels: input.channels.join(','),
        status: 'FAILED',
        metadata: {
          error: error.message,
          // ❌ NO PII
        },
      },
    }).catch(err => logger.error("Failed to log notification failure:", err));

    return {
      success: false,
      notification_id,
      channels_sent: [],
      channels_failed: input.channels,
      message: error.message,
    };
  }
};

/**
 * Build notification content based on type
 */
function buildNotificationContent(
  type: NotificationType,
  metadata: any,
  language: string
): {
  subject: string;
  body: string;
  html: string;
  sms_text: string;
  push_title: string;
  push_body: string;
} {
  // Get translations (simplified - in production use i18n library)
  const translations = getTranslations(language);

  switch (type) {
    case 'consent_granted':
      return {
        subject: translations.consent_granted_subject,
        body: `Dear User,\n\nYour consent for ${metadata.purpose_titles?.join(', ') || 'data processing'} has been successfully recorded.\n\nArtifact ID: ${metadata.artifact_id}\nFiduciary: ${metadata.fiduciary_name}\n\nThank you.`,
        html: `<h2>Consent Granted</h2><p>Your consent has been recorded.</p>`,
        sms_text: `Your consent for ${metadata.fiduciary_name} has been recorded. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_granted_subject,
        push_body: `Consent recorded for ${metadata.fiduciary_name}`,
      };

    case 'consent_withdrawn':
      return {
        subject: translations.consent_withdrawn_subject,
        body: `Dear User,\n\nYour consent has been withdrawn.\n\nArtifact ID: ${metadata.artifact_id}\n\nThank you.`,
        html: `<h2>Consent Withdrawn</h2><p>Your consent has been withdrawn.</p>`,
        sms_text: `Your consent has been withdrawn. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_withdrawn_subject,
        push_body: 'Your consent has been withdrawn',
      };

    case 'consent_expired':
      return {
        subject: translations.consent_expired_subject,
        body: `Dear User,\n\nYour consent has expired.\n\nArtifact ID: ${metadata.artifact_id}\nExpired on: ${metadata.expires_at}\n\nPlease renew if you wish to continue.`,
        html: `<h2>Consent Expired</h2><p>Your consent has expired. Please renew.</p>`,
        sms_text: `Your consent for ${metadata.fiduciary_name} has expired. Please renew.`,
        push_title: translations.consent_expired_subject,
        push_body: 'Your consent has expired. Tap to renew.',
      };

    case 'consent_renewal_reminder':
      return {
        subject: translations.consent_renewal_reminder_subject,
        body: `Dear User,\n\nYour consent will expire soon.\n\nArtifact ID: ${metadata.artifact_id}\nExpires on: ${metadata.expires_at}\n\nRenew now: ${metadata.action_url}`,
        html: `<h2>Consent Expiring Soon</h2><p>Renew your consent now.</p><a href="${metadata.action_url}">Renew Now</a>`,
        sms_text: `Your consent expires soon. Renew at: ${metadata.action_url}`,
        push_title: translations.consent_renewal_reminder_subject,
        push_body: 'Your consent expires soon. Tap to renew.',
      };

    case 'consent_updated':
      return {
        subject: translations.consent_updated_subject,
        body: `Dear User,\n\nYour consent has been updated.\n\nArtifact ID: ${metadata.artifact_id}\n\nThank you.`,
        html: `<h2>Consent Updated</h2><p>Your consent has been updated.</p>`,
        sms_text: `Your consent has been updated. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_updated_subject,
        push_body: 'Your consent has been updated',
      };

    case 'consent_renewed':
      return {
        subject: translations.consent_renewed_subject,
        body: `Dear User,\n\nYour consent has been successfully renewed.\n\nArtifact ID: ${metadata.artifact_id}\nFiduciary: ${metadata.fiduciary_name}\nPurposes: ${metadata.purpose_titles?.join(', ') || 'N/A'}\nNew Expiry: ${metadata.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'N/A'}\n\nThank you.`,
        html: `<h2>Consent Renewed</h2><p>Your consent has been successfully renewed.</p><p>New expiry date: ${metadata.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'N/A'}</p>`,
        sms_text: `Your consent for ${metadata.fiduciary_name} has been renewed. New expiry: ${metadata.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'N/A'}`,
        push_title: translations.consent_renewed_subject,
        push_body: `Consent renewed for ${metadata.fiduciary_name}`,
      };

    default:
      return {
        subject: 'Notification',
        body: 'You have a new notification.',
        html: '<p>You have a new notification.</p>',
        sms_text: 'You have a new notification.',
        push_title: 'Notification',
        push_body: 'You have a new notification.',
      };
  }
}

/**
 * Get translations for language
 */
function getTranslations(language: string): Record<string, string> {
  const translations: Record<string, Record<string, string>> = {
    en: {
      consent_granted_subject: 'Consent Recorded Successfully',
      consent_withdrawn_subject: 'Consent Withdrawn',
      consent_expired_subject: 'Consent Expired',
      consent_renewal_reminder_subject: 'Consent Expiring Soon',
      consent_updated_subject: 'Consent Updated',
      consent_renewed_subject: 'Consent Renewed Successfully',
    },
    hi: {
      consent_granted_subject: 'सहमति सफलतापूर्वक दर्ज की गई',
      consent_withdrawn_subject: 'सहमति वापस ली गई',
      consent_expired_subject: 'सहमति समाप्त हो गई',
      consent_renewal_reminder_subject: 'सहमति जल्द समाप्त हो रही है',
      consent_updated_subject: 'सहमति अपडेट की गई',
      consent_renewed_subject: 'सहमति सफलतापूर्वक नवीकृत की गई',
    },
  };

  return translations[language] || translations['en'];
}

/**
 * Send email notification via SendGrid/AWS SES
 */
async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
  html: string
): Promise<void> {
  // TODO: Integrate with SendGrid or AWS SES
  
  // Example with SendGrid (install: npm install @sendgrid/mail)
  /*
  import sgMail from '@sendgrid/mail';
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  
  const msg = {
    to,
    from: process.env.SENDER_EMAIL!,
    subject,
    text: body,
    html,
  };
  
  await sgMail.send(msg);
  */

  // For now, just log (replace with actual email service)
  logger.info(`[EMAIL] Sending to ${maskEmail(to)}: ${subject}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // In production, throw error if email fails
  // throw new Error("Email service unavailable");
}

/**
 * Send SMS notification via Twilio/AWS SNS
 */
async function sendSMSNotification(
  to: string,
  message: string
): Promise<void> {
  // TODO: Integrate with Twilio or AWS SNS
  
  // Example with Twilio (install: npm install twilio)
  /*
  import twilio from 'twilio';
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
  */

  // For now, just log (replace with actual SMS service)
  logger.info(`[SMS] Sending to ${maskPhone(to)}: ${message}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Send push notification via FCM/APNS
 */
async function sendPushNotification(
  user_id: string,
  title: string,
  body: string
): Promise<void> {
  // TODO: Integrate with Firebase Cloud Messaging or APNS
  
  // For now, just log
  logger.info(`[PUSH] Sending to user ${user_id}: ${title}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Mask email for logging (PII protection)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Mask phone for logging (PII protection)
 */
function maskPhone(phone: string): string {
  return `***${phone.slice(-4)}`;
}

/**
 * Generate audit hash
 */
function generateAuditHash(data: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}


