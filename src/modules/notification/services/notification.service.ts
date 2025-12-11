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
import { Resend } from "resend";
import { env } from "@/config/env/env";

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
    fiduciary_logo?: string;
    purpose_titles?: string[];
    expires_at?: Date;
    action_url?: string;
    external_id?: string; // For consent dashboard URL
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
    // Include external_id for consent dashboard URL
    const enrichedMetadata = {
      ...input.metadata,
      external_id: input.metadata?.external_id || principal.external_id,
    };
    
    const content = buildNotificationContent(
      input.notification_type,
      enrichedMetadata,
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
 * Generate HTML email template with consistent styling
 */
function generateEmailHTML(params: {
  title: string;
  heading: string;
  message: string;
  fiduciary_name?: string;
  fiduciary_logo?: string;
  artifact_id?: string;
  purpose_titles?: string[];
  expires_at?: Date;
  external_id?: string;
  showDashboardButton?: boolean;
  additionalInfo?: { label: string; value: string }[];
}): string {
  const dashboardUrl = params.external_id 
    ? `https://dpdp.aurelionfutureforge.com/my-consents/${params.external_id}`
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${params.heading}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${params.message}
              </p>
              
              ${params.fiduciary_name ? `
              <!-- Fiduciary Info Card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                ${params.fiduciary_logo ? `
                <img src="${params.fiduciary_logo}" alt="${params.fiduciary_name}" style="max-width: 150px; max-height: 50px; margin-bottom: 15px;">
                ` : ''}
                <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">
                  Data Fiduciary Information
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Organization:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${params.fiduciary_name}</td>
                  </tr>
                  ${params.artifact_id ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Reference ID:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; font-family: monospace;">${params.artifact_id}</td>
                  </tr>
                  ` : ''}
                  ${params.purpose_titles && params.purpose_titles.length > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600; vertical-align: top;">Purposes:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">
                      ${params.purpose_titles.map(p => `<span style="display: inline-block; background-color: #e7eaf6; color: #667eea; padding: 4px 12px; margin: 2px 4px 2px 0; border-radius: 12px; font-size: 13px;">${p}</span>`).join('')}
                    </td>
                  </tr>
                  ` : ''}
                  ${params.expires_at ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Expires On:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${new Date(params.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  ` : ''}
                  ${params.additionalInfo ? params.additionalInfo.map(info => `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">${info.label}:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px;">${info.value}</td>
                  </tr>
                  `).join('') : ''}
                </table>
              </div>
              ` : ''}
              
              ${dashboardUrl && params.showDashboardButton !== false ? `
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                  View My Consent Dashboard
                </a>
              </div>
              <p style="text-align: center; color: #666666; font-size: 13px; margin-top: 15px;">
                Or copy and paste this URL into your browser:<br>
                <a href="${dashboardUrl}" style="color: #667eea; word-break: break-all;">${dashboardUrl}</a>
              </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                This is an automated notification from your Data Consent Management System.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                If you have any questions, please contact the Data Fiduciary organization directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

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
        html: generateEmailHTML({
          title: translations.consent_granted_subject,
          heading: '✓ Consent Recorded Successfully',
          message: 'Your consent has been successfully recorded. You can view and manage all your consents from your dashboard.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent for ${metadata.fiduciary_name} has been recorded. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_granted_subject,
        push_body: `Consent recorded for ${metadata.fiduciary_name}`,
      };

    case 'consent_withdrawn':
      return {
        subject: translations.consent_withdrawn_subject,
        body: `Dear User,\n\nYour consent has been withdrawn.\n\nArtifact ID: ${metadata.artifact_id}\n\nThank you.`,
        html: generateEmailHTML({
          title: translations.consent_withdrawn_subject,
          heading: 'Consent Withdrawn',
          message: 'Your consent has been withdrawn as requested. The organization will no longer process your data under this consent.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent has been withdrawn. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_withdrawn_subject,
        push_body: 'Your consent has been withdrawn',
      };

    case 'consent_expired':
      return {
        subject: translations.consent_expired_subject,
        body: `Dear User,\n\nYour consent has expired.\n\nArtifact ID: ${metadata.artifact_id}\nExpired on: ${metadata.expires_at}\n\nPlease renew if you wish to continue.`,
        html: generateEmailHTML({
          title: translations.consent_expired_subject,
          heading: '⚠ Consent Expired',
          message: 'Your consent has expired. If you wish to continue allowing the organization to process your data, please renew your consent.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          expires_at: metadata.expires_at,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent for ${metadata.fiduciary_name} has expired. Please renew.`,
        push_title: translations.consent_expired_subject,
        push_body: 'Your consent has expired. Tap to renew.',
      };

    case 'consent_renewal_reminder':
      return {
        subject: translations.consent_renewal_reminder_subject,
        body: `Dear User,\n\nYour consent will expire soon.\n\nArtifact ID: ${metadata.artifact_id}\nExpires on: ${metadata.expires_at}\n\nRenew now: ${metadata.action_url}`,
        html: generateEmailHTML({
          title: translations.consent_renewal_reminder_subject,
          heading: '🔔 Consent Expiring Soon',
          message: 'Your consent is about to expire. Please review and renew your consent to continue allowing the organization to process your data.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          expires_at: metadata.expires_at,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent expires soon. Renew at: ${metadata.action_url || `https://dpdp.aurelionfutureforge.com/my-consents/${metadata.external_id}`}`,
        push_title: translations.consent_renewal_reminder_subject,
        push_body: 'Your consent expires soon. Tap to renew.',
      };

    case 'consent_updated':
      return {
        subject: translations.consent_updated_subject,
        body: `Dear User,\n\nYour consent has been updated.\n\nArtifact ID: ${metadata.artifact_id}\n\nThank you.`,
        html: generateEmailHTML({
          title: translations.consent_updated_subject,
          heading: 'Consent Updated',
          message: 'Your consent preferences have been updated successfully.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent has been updated. Ref: ${metadata.artifact_id}`,
        push_title: translations.consent_updated_subject,
        push_body: 'Your consent has been updated',
      };

    case 'consent_renewed':
      return {
        subject: translations.consent_renewed_subject,
        body: `Dear User,\n\nYour consent has been successfully renewed.\n\nArtifact ID: ${metadata.artifact_id}\nFiduciary: ${metadata.fiduciary_name}\nPurposes: ${metadata.purpose_titles?.join(', ') || 'N/A'}\nNew Expiry: ${metadata.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'N/A'}\n\nThank you.`,
        html: generateEmailHTML({
          title: translations.consent_renewed_subject,
          heading: '✓ Consent Renewed Successfully',
          message: 'Your consent has been successfully renewed. The organization can continue processing your data under the renewed consent.',
          fiduciary_name: metadata.fiduciary_name,
          fiduciary_logo: metadata.fiduciary_logo,
          artifact_id: metadata.artifact_id,
          purpose_titles: metadata.purpose_titles,
          expires_at: metadata.expires_at,
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
        sms_text: `Your consent for ${metadata.fiduciary_name} has been renewed. New expiry: ${metadata.expires_at ? new Date(metadata.expires_at).toLocaleDateString() : 'N/A'}`,
        push_title: translations.consent_renewed_subject,
        push_body: `Consent renewed for ${metadata.fiduciary_name}`,
      };

    default:
      return {
        subject: 'Notification',
        body: 'You have a new notification.',
        html: generateEmailHTML({
          title: 'Notification',
          heading: 'Notification',
          message: 'You have a new notification regarding your data consent.',
          external_id: metadata.external_id,
          showDashboardButton: true,
        }),
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
 * Send email notification via Resend
 */
async function sendEmailNotification(
  to: string,
  subject: string,
  body: string,
  html: string
): Promise<void> {
  try {
    // Initialize Resend client
    const resend = new Resend(env.RESEND_API_KEY);
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'no-reply@aurelionnext.com',
      to: [to],
      subject: subject,
      text: body,
      html: html,
    });

    if (error) {
      logger.error(`[EMAIL] Resend error for ${maskEmail(to)}:`, error);
      throw new Error(`Email service error: ${error.message}`);
    }

    logger.info(`[EMAIL] Successfully sent to ${maskEmail(to)}: ${subject} (ID: ${data?.id})`);
  } catch (error: any) {
    logger.error(`[EMAIL] Failed to send to ${maskEmail(to)}:`, error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
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


