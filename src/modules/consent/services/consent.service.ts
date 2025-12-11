/**
 * @fileoverview Service layer for Consent Collection business logic.
 * @module modules/consent/services
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import * as ConsentTypes from "@/modules/consent/interfaces/consent.interface";
import crypto from "crypto";
import logger from "@/modules/common/utils/logger";
import { sendNotification } from "@/modules/notification/services/notification.service";

/**
 * Step 1: Initiate Consent Request (Data Fiduciary initiates)
 * POST /api/v1/consents/initiate
 *
 * @param {ConsentTypes.InitiateConsentInput} input - Consent initiation data
 * @returns {Promise<ConsentTypes.ApiResponse<ConsentTypes.InitiateConsentResponse>>}
 */
export const initiateConsent = async (
  input: ConsentTypes.InitiateConsentInput
): Promise<ConsentTypes.ApiResponse<ConsentTypes.InitiateConsentResponse>> => {
  try {
    // Validate data fiduciary exists and is active
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id: input.data_fiduciary_id },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (!fiduciary.is_active) {
      throw new AppError("Data fiduciary is not active", 403);
    }

    // Validate all purposes exist and belong to this fiduciary
    const purposes = await prisma.purpose.findMany({
      where: {
        purpose_id: { in: input.purposes },
        data_fiduciary_id: input.data_fiduciary_id,
        is_active: true,
      },
      include: {
        purpose_version: {
          where: { is_current: true },
          take: 1,
        },
      },
    });

    if (purposes.length !== input.purposes.length) {
      throw new AppError("One or more purposes not found or inactive", 400);
    }

    // Check if all mandatory purposes are included
    const mandatoryPurposes = purposes.filter(p => p.is_mandatory);
    const mandatoryPurposeIds = mandatoryPurposes.map(p => p.purpose_id);
    const missingMandatory = mandatoryPurposeIds.filter(id => !input.purposes.includes(id));

    if (missingMandatory.length > 0) {
      throw new AppError("All mandatory purposes must be included", 400);
    }

    // Create or get data principal
    let principal = await prisma.dataPrincipal.findUnique({
      where: { external_id: input.user_id },
    });

    if (!principal) {
      // Create new principal with optional email and phone
      principal = await prisma.dataPrincipal.create({
        data: {
          external_id: input.user_id,
          language: input.language || "en",
          email: input.email,
          phone: input.phone,
        },
      });
    } else {
      // Update existing principal with email and phone if provided
      const updateData: { email?: string; phone?: string } = {};
      if (input.email) {
        updateData.email = input.email;
      }
      if (input.phone) {
        updateData.phone = input.phone;
      }

      if (Object.keys(updateData).length > 0) {
        principal = await prisma.dataPrincipal.update({
          where: { data_principal_id: principal.data_principal_id },
          data: updateData,
        });
      }
    }

    // Create principal-fiduciary mapping if not exists
    let mapping = await prisma.principalFiduciaryMap.findUnique({
      where: {
        data_fiduciary_id_external_ref: {
          data_fiduciary_id: input.data_fiduciary_id,
          external_ref: input.user_id,
        },
      },
    });

    if (!mapping) {
      mapping = await prisma.principalFiduciaryMap.create({
        data: {
          data_fiduciary_id: input.data_fiduciary_id,
          principal_id: principal.data_principal_id,
          external_ref: input.user_id,
        },
      });
    }

    // Calculate expiration (default 24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Generate consent request ID
    const cms_request_id = crypto.randomUUID();

    // Validate first purpose has a current version
    const firstPurpose = purposes[0];
    if (!firstPurpose.purpose_version || firstPurpose.purpose_version.length === 0) {
      throw new AppError(`Purpose ${firstPurpose.purpose_id} has no current version`, 500);
    }

    // Store consent request in metadata (you might want a separate ConsentRequest table)
    // For now, we'll use the metadata field of ConsentArtifact with PENDING status
    const consentRequest = await prisma.consentArtifact.create({
      data: {
        consent_artifact_id: cms_request_id,
        data_fiduciary_id: input.data_fiduciary_id,
        data_principal_id: principal.data_principal_id,
        principal_fiduciary_map_id: mapping.principal_fiduciary_map_id,
        purpose_id: firstPurpose.purpose_id, // Primary purpose
        purpose_version_id: firstPurpose.purpose_version[0].purpose_version_id,
        status: "PENDING",
        expires_at: expiresAt,
        metadata: {
          consent_request: true,
          purposes: input.purposes,
          data_fields: input.data_fields,
          duration: input.duration,
          language: input.language || "en",
          external_user_id: input.user_id,
          redirect_url: input.redirect_url,
          ...(input.email || input.phone ? {
            user_details: {
              ...(input.email && { email: input.email }),
              ...(input.phone && { phone: input.phone }),
            },
          } : {}),
          ...input.metadata,
        },
      },
    });

    // Generate notice URL
    const base_url = process.env.CMS_BASE_URL || "http://localhost:3000";
    const notice_url = `${base_url}/consents/${cms_request_id}`;

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: principal.data_principal_id,
        consent_artifact_id: cms_request_id,
        action: "CREATE",
        consent_status: "PENDING",
        initiator: "FIDUCIARY",
        audit_hash: generateAuditHash({
          action: "CREATE",
          artifact_id: cms_request_id,
          timestamp: new Date(),
        }),
        details: {
          purposes: input.purposes,
          external_user_id: input.user_id,
        },
      },
    });

    logger.info(`Consent request initiated: ${cms_request_id} for fiduciary: ${input.data_fiduciary_id}`);

    return {
      success: true,
      message: "Consent request initiated successfully",
      data: {
        cms_request_id,
        notice_url,
        status: "INITIATED" as const,
        expires_at: expiresAt,
        redirect_url: input.redirect_url, // ✅ Return redirect URL
      },
    };
  } catch (error) {
    logger.error("Error initiating consent:", error);
    throw error;
  }
};

/**
 * Step 5-7: Get Consent Notice (Data Principal views consent notice)
 * GET /consents/:cms_request_id
 *
 * @param {string} cms_request_id - Consent request ID
 * @param {string} language - Language code
 * @returns {Promise<ConsentTypes.ApiResponse<ConsentTypes.ConsentNoticeData>>}
 */
export const getConsentNotice = async (
  cms_request_id: string,
  language: string = "en"
): Promise<ConsentTypes.ApiResponse<ConsentTypes.ConsentNoticeData>> => {
  try {
    // Fetch consent request
    const consentRequest = await prisma.consentArtifact.findUnique({
      where: { consent_artifact_id: cms_request_id },
      include: {
        fiduciary: true,
        principal: true,
      },
    });

    if (!consentRequest) {
      throw new AppError("Consent request not found", 404);
    }

    if (consentRequest.status !== "PENDING") {
      throw new AppError("Consent request has already been processed", 400);
    }

    if (consentRequest.expires_at && consentRequest.expires_at < new Date()) {
      throw new AppError("Consent request has expired", 410);
    }

    const metadata = consentRequest.metadata as any;
    const purposeIds = metadata.purposes || [];

    // Fetch all purposes with current versions and translations
    const purposes = await prisma.purpose.findMany({
      where: {
        purpose_id: { in: purposeIds },
        data_fiduciary_id: consentRequest.data_fiduciary_id,
      },
      include: {
        category: true,
        purpose_version: {
          where: { is_current: true },
          take: 1,
        },
        translations: {
          where: { language_code: language },
        },
      },
    });

    // Transform purposes for consent notice
    const purposeDetails: ConsentTypes.ConsentPurposeDetail[] = purposes
      .filter(purpose => {
        // Skip purposes without a current version
        if (!purpose.purpose_version || purpose.purpose_version.length === 0) {
          logger.warn(`Purpose ${purpose.purpose_id} has no current version, skipping from consent notice`);
          return false;
        }
        return true;
      })
      .map(purpose => {
        const currentVersion = purpose.purpose_version[0];
        const translation = purpose.translations[0];

        return {
          purpose_id: purpose.purpose_id,
          purpose_version_id: currentVersion.purpose_version_id,
          version_number: currentVersion.version_number,
          title: translation?.title || currentVersion.title,
          description: translation?.description || currentVersion.description || "",
          legal_basis: purpose.legal_basis || "",
          data_fields: purpose.data_fields,
          processing_activities: purpose.processing_activities,
          retention_period_days: purpose.retention_period_days || 365,
          is_mandatory: purpose.is_mandatory,
          category: purpose.category ? {
            purpose_category_id: purpose.category.purpose_category_id,
            name: purpose.category.name,
          } : undefined,
        };
      });

    // Validate we have at least one valid purpose
    if (purposeDetails.length === 0) {
      throw new AppError("No valid purposes found for consent request", 500);
    }

    // ✅ Group purposes by category
    const purposesByCategoryMap = new Map<string | null, ConsentTypes.ConsentPurposeDetail[]>();

    purposeDetails.forEach(purpose => {
      const categoryId = purpose.category?.purpose_category_id || null;

      if (!purposesByCategoryMap.has(categoryId)) {
        purposesByCategoryMap.set(categoryId, []);
      }

      purposesByCategoryMap.get(categoryId)!.push(purpose);
    });

    // ✅ Transform to PurposeCategoryGroup array
    const purposesByCategory: ConsentTypes.PurposeCategoryGroup[] = Array.from(purposesByCategoryMap.entries()).map(([categoryId, purposes]) => {
      // Find category name from first purpose in this category
      const firstPurpose = purposes[0];
      const categoryName = firstPurpose.category?.name || null;

      return {
        category_id: categoryId,
        category_name: categoryName,
        purposes: purposes,
      };
    });

    // ✅ Sort categories: Uncategorized first, then by category name
    purposesByCategory.sort((a, b) => {
      // Uncategorized goes first
      if (a.category_id === null && b.category_id !== null) return -1;
      if (a.category_id !== null && b.category_id === null) return 1;
      // Both have categories - sort by name
      if (a.category_name && b.category_name) {
        return a.category_name.localeCompare(b.category_name);
      }
      return 0;
    });

    // Get all unique data fields
    const allDataFields = Array.from(
      new Set(purposes.flatMap(p => p.data_fields))
    );

    // Get max retention period
    const maxRetention = Math.max(...purposes.map(p => p.retention_period_days || 365));

    // Get mandatory purpose IDs
    const mandatoryPurposes = purposes.filter(p => p.is_mandatory).map(p => p.purpose_id);

    // ✅ Get redirect URL: Use metadata.redirect_url, or fallback to DataFiduciary's active platform submission URL
    let redirectUrl = metadata?.redirect_url;

    if (!redirectUrl) {
      // Fetch active (APPROVED) platform submission with WEBSITE type
      const activePlatform = await prisma.platformSubmission.findFirst({
        where: {
          data_fiduciary_id: consentRequest.data_fiduciary_id,
          status: "APPROVED",
          platform_type: "WEBSITE",
        },
        orderBy: {
          approved_at: "desc", // Get most recently approved
        },
      });

      if (activePlatform) {
        redirectUrl = activePlatform.url;
        logger.info(`Using fallback redirect URL from platform submission: ${redirectUrl} for fiduciary: ${consentRequest.data_fiduciary_id}`);
      } else {
        logger.warn(`No redirect URL in metadata and no active platform submission found for fiduciary: ${consentRequest.data_fiduciary_id}`);
      }
    }

    // Update viewed timestamp
    await prisma.consentArtifact.update({
      where: { consent_artifact_id: cms_request_id },
      data: {
        updated_at: new Date(),
        metadata: {
          ...metadata,
          viewed_at: new Date(),
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: consentRequest.data_principal_id,
        consent_artifact_id: cms_request_id,
        action: "SYSTEM",
        consent_status: "PENDING",
        initiator: "USER",
        audit_hash: generateAuditHash({
          action: "VIEW",
          artifact_id: cms_request_id,
          timestamp: new Date(),
        }),
        details: {
          action: "CONSENT_NOTICE_VIEWED",
        },
      },
    });

    logger.info(`Consent notice viewed: ${cms_request_id}`);

    return {
      success: true,
      message: "Consent notice retrieved successfully",
      data: {
        cms_request_id,
        data_fiduciary: {
          data_fiduciary_id: consentRequest.fiduciary.data_fiduciary_id,
          name: consentRequest.fiduciary.name,
          legal_name: consentRequest.fiduciary.legal_name,
          logo_url: consentRequest.fiduciary.logo_url || undefined,
          contact_email: consentRequest.fiduciary.contact_email,
          website_url: consentRequest.fiduciary.website_url || undefined,
          privacy_policy_url: consentRequest.fiduciary.privacy_policy_url || undefined,
        },
        purposes_by_category: purposesByCategory,
        retention_policy: {
          retention_period_days: maxRetention,
          withdrawal_policy: "You can withdraw your consent at any time through your account settings or by contacting us.",
        },
        language_config: {
          language_code: language,
          translations: {}, // Add translations as needed
        },
        valid_until: consentRequest.expires_at!,
        mandatory_purposes: mandatoryPurposes,
        redirect_url: redirectUrl || undefined,
      },
    };
  } catch (error) {
    logger.error("Error fetching consent notice:", error);
    throw error;
  }
};

/**
 * Step 8-11: Submit Consent (Data Principal submits consent)
 * POST /api/v1/consents/submit
 *
 * @param {ConsentTypes.SubmitConsentInput} input - Consent submission data
 * @returns {Promise<ConsentTypes.ApiResponse<ConsentTypes.SubmitConsentResponse>>}
 */
export const submitConsent = async (
  input: ConsentTypes.SubmitConsentInput
): Promise<ConsentTypes.ApiResponse<ConsentTypes.SubmitConsentResponse>> => {
  try {
    // Fetch consent request
    const consentRequest = await prisma.consentArtifact.findUnique({
      where: { consent_artifact_id: input.cms_request_id },
      include: {
        fiduciary: true,
        principal: true,
      },
    });

    if (!consentRequest) {
      throw new AppError("Consent request not found", 404);
    }

    if (consentRequest.status !== "PENDING") {
      throw new AppError("Consent request has already been processed", 400);
    }

    if (consentRequest.expires_at && consentRequest.expires_at < new Date()) {
      throw new AppError("Consent request has expired", 410);
    }

    const metadata = consentRequest.metadata as any;
    const requestedPurposes = metadata.purposes || [];

    // Validate selected purposes are subset of requested purposes
    const invalidPurposes = input.selected_purposes.filter(
      id => !requestedPurposes.includes(id)
    );

    if (invalidPurposes.length > 0) {
      throw new AppError("Invalid purposes selected", 400);
    }

    // Fetch purposes to check mandatory ones
    const purposes = await prisma.purpose.findMany({
      where: {
        purpose_id: { in: requestedPurposes },
        data_fiduciary_id: consentRequest.data_fiduciary_id,
      },
      include: {
        purpose_version: {
          where: { is_current: true },
          take: 1,
        },
      },
    });

    // Validate all mandatory purposes are selected
    const mandatoryPurposeIds = purposes
      .filter(p => p.is_mandatory)
      .map(p => p.purpose_id);

    const missingMandatory = mandatoryPurposeIds.filter(
      id => !input.selected_purposes.includes(id)
    );

    if (missingMandatory.length > 0) {
      throw new AppError("All mandatory purposes must be selected", 400);
    }

    // Calculate expiry date
    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt);
    const customDuration = metadata.duration || 365; // Default 1 year
    expiresAt.setDate(expiresAt.getDate() + customDuration);

    // Generate consent text hash (SHA256)
    const consentText = {
      purposes: input.selected_purposes,
      data_fiduciary_id: consentRequest.data_fiduciary_id,
      granted_at: grantedAt,
      version: "ART_5001", // Consent artifact version
    };
    const consentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(consentText))
      .digest("hex");

    // Create consent artifacts for each selected purpose
    const consentArtifacts = await Promise.all(
      input.selected_purposes.map(async (purposeId) => {
        const purpose = purposes.find(p => p.purpose_id === purposeId);
        if (!purpose) {
          logger.warn(`Purpose ${purposeId} not found during consent submission`);
          return null;
        }

        const currentVersion = purpose.purpose_version[0];
        if (!currentVersion) {
          logger.error(`Purpose ${purposeId} has no current version, cannot create consent artifact`);
          return null;
        }

        return await prisma.consentArtifact.create({
          data: {
            data_fiduciary_id: consentRequest.data_fiduciary_id,
            data_principal_id: consentRequest.data_principal_id,
            principal_fiduciary_map_id: consentRequest.principal_fiduciary_map_id,
            purpose_id: purposeId,
            purpose_version_id: currentVersion.purpose_version_id,
            status: "ACTIVE",
            granted_at: grantedAt,
            expires_at: expiresAt,
            consent_text_hash: consentHash,
            metadata: {
              language_code: input.language_code,
              ip_address: input.ip_address,
              user_agent: input.user_agent,
              consent_request_id: input.cms_request_id,
              external_user_id: metadata.external_user_id,
            },
          },
          include: {
            purpose_version: {
              select: {
                purpose_version_id: true,
                title: true,
              },
            },
          },
        });
      })
    );

    const validArtifacts = consentArtifacts.filter(a => a !== null);

    if (validArtifacts.length === 0) {
      throw new AppError("Failed to create consent artifacts", 500);
    }

    // Update original request to submitted
    await prisma.consentArtifact.update({
      where: { consent_artifact_id: input.cms_request_id },
      data: {
        status: "ACTIVE",
        granted_at: grantedAt,
        metadata: {
          ...metadata,
          submitted_at: new Date(),
          selected_purposes: input.selected_purposes,
        },
      },
    });

    // Create consent history records
    await Promise.all(
      validArtifacts.map(artifact =>
        prisma.consentHistory.create({
          data: {
            consent_artifact_id: artifact!.consent_artifact_id,
            action: "GRANT",
            previous_status: "PENDING",
            new_status: "ACTIVE",
            performed_by: consentRequest.data_principal_id,
            performed_by_type: "principal",
            notes: "Consent granted by data principal",
          },
        })
      )
    );

    // Create audit logs
    await Promise.all(
      validArtifacts.map(artifact =>
        prisma.auditLog.create({
          data: {
            user_id: consentRequest.data_principal_id,
            purpose_id: artifact!.purpose_id,
            consent_artifact_id: artifact!.consent_artifact_id,
            action: "CREATE",
            consent_status: "ACTIVE",
            initiator: "USER",
            source_ip: input.ip_address,
            audit_hash: generateAuditHash({
              action: "GRANT",
              artifact_id: artifact!.consent_artifact_id,
              timestamp: grantedAt,
            }),
            details: {
              purpose_id: artifact!.purpose_id,
              purpose_version_id: artifact!.purpose_version_id,
            },
          },
        })
      )
    );

    // Prepare webhook payload
    const webhookPayload: ConsentTypes.ConsentWebhookPayload = {
      event_type: "consent.granted",
      artifact_id: validArtifacts[0]!.consent_artifact_id,
      data_fiduciary_id: consentRequest.data_fiduciary_id,
      user_id: metadata.external_user_id,
      purposes: validArtifacts.map(a => ({
        purpose_id: a!.purpose_id,
        purpose_version_id: a!.purpose_version_id,
        title: a!.purpose_version.title,
      })),
      status: "ACTIVE",
      valid_till: expiresAt,
      granted_at: grantedAt,
      metadata: {
        language_code: input.language_code,
        ip_address: input.ip_address,
      },
    };

    // Send webhook notification (async, don't await)
    sendWebhookNotification(
      consentRequest.fiduciary.webhook_url,
      consentRequest.fiduciary.webhook_secret,
      webhookPayload,
      consentRequest.data_fiduciary_id
    ).catch(err => {
      logger.error("Webhook notification failed:", err);
      // Push to dead letter queue
      pushToDeadLetterQueue(webhookPayload, consentRequest.data_fiduciary_id);
    });

    logger.info(`Consent submitted: ${validArtifacts[0]!.consent_artifact_id} for fiduciary: ${consentRequest.data_fiduciary_id}`);

    // Step 7: Send notification to user (PII-FREE)
    // ✅ We only pass user_id (UUID), not email/phone
    sendNotification({
      user_id: consentRequest.data_principal_id, // ✅ Only UUID reference
      notification_type: 'consent_granted',
      channels: ['EMAIL', 'SMS'],
      metadata: {
        artifact_id: validArtifacts[0]!.consent_artifact_id,
        fiduciary_name: consentRequest.fiduciary.name,
        fiduciary_logo: consentRequest.fiduciary.logo_url || undefined,
        purpose_titles: validArtifacts.map(a => a!.purpose_version.title),
        external_id: consentRequest.principal.external_id || undefined,
      },
      language: input.language_code,
    }).catch(err => {
      // Non-blocking: Log error but don't fail the consent submission
      logger.error("Failed to send notification:", err);
    });

    // ✅ Prepare redirect URL with consent status
    // Use metadata.redirect_url, or fallback to DataFiduciary's active platform submission URL
    let redirectUrl = metadata?.redirect_url;

    if (!redirectUrl) {
      // Fetch active (APPROVED) platform submission with WEBSITE type
      const activePlatform = await prisma.platformSubmission.findFirst({
        where: {
          data_fiduciary_id: consentRequest.data_fiduciary_id,
          status: "APPROVED",
          platform_type: "WEBSITE",
        },
        orderBy: {
          approved_at: "desc", // Get most recently approved
        },
      });

      if (activePlatform) {
        redirectUrl = activePlatform.url;
        logger.info(`Using fallback redirect URL from platform submission: ${redirectUrl} for fiduciary: ${consentRequest.data_fiduciary_id}`);
      } else {
        logger.warn(`No redirect URL in metadata and no active platform submission found for fiduciary: ${consentRequest.data_fiduciary_id}`);
      }
    }

    const redirectParams = redirectUrl ? {
      consent_id: validArtifacts[0]!.consent_artifact_id,
      status: 'granted',
      timestamp: new Date().toISOString(),
    } : undefined;

    // Return response
    return {
      success: true,
      message: "Consent submitted successfully",
      data: {
        artifact_id: validArtifacts[0]!.consent_artifact_id,
        status: "ACTIVE",
        valid_till: expiresAt,
        purposes: validArtifacts.map(a => ({
          purpose_id: a!.purpose_id,
          purpose_version_id: a!.purpose_version_id,
          title: a!.purpose_version.title,
          granted_at: grantedAt,
        })),
        hash: consentHash,
        redirect_url: redirectUrl, // ✅ Return redirect URL from initiate
        redirect_params: redirectParams, // ✅ Return params to append
      },
    };
  } catch (error) {
    logger.error("Error submitting consent:", error);
    throw error;
  }
};

/**
 * Step 16-18: Validate Consent Artifact
 * GET /api/v1/consents/validate?artifact_id=ART_5001&data_fiduciary_id=xxx
 *
 * @param {ConsentTypes.ValidateConsentInput} input - Validation input
 * @returns {Promise<ConsentTypes.ApiResponse<ConsentTypes.ValidateConsentResponse>>}
 */
export const validateConsent = async (
  input: ConsentTypes.ValidateConsentInput
): Promise<ConsentTypes.ApiResponse<ConsentTypes.ValidateConsentResponse>> => {
  try {
    const startTime = Date.now();

    // Step 2: Log "Consent Validation Request Received"
    logger.info(`[VALIDATION-REQUEST] Consent Validation Request Received - Artifact: ${input.artifact_id}, DF: ${input.data_fiduciary_id}, Purpose: ${input.purpose_id || 'ALL'}`);

    // Step 3: Fetch consent artifact details
    const artifact = await prisma.consentArtifact.findFirst({
      where: {
        consent_artifact_id: input.artifact_id,
        data_fiduciary_id: input.data_fiduciary_id,
        is_deleted: false,
      },
      include: {
        purpose_version: {
          select: {
            purpose_id: true,
            purpose_version_id: true,
            title: true,
          },
        },
      },
    });

    if (!artifact) {
      // Step 11a: Log "Consent Invalid - Block Data Access"
      logger.warn(`[VALIDATION-FAILED] Consent Invalid - Block Data Access - Artifact: ${input.artifact_id}, Reason: NOT_FOUND`);

      // NOTE: We DON'T log to ConsentValidation table here because the artifact doesn't exist
      // Foreign key constraint would fail. Only log validations for existing artifacts.

      return {
        success: true,
        message: "Consent validation completed",
        data: {
          is_valid: false,
          status: "NOT_FOUND",
          artifact_id: input.artifact_id,
          message: "Consent artifact not found or has been deleted",
        },
      };
    }

    // Step 4: Validate artifact expiry, status, and signature hash
    // Check expiry
    if (artifact.expires_at && artifact.expires_at < new Date()) {
      // Step 11a: Log "Consent Invalid - Block Data Access"
      logger.warn(`[VALIDATION-FAILED] Consent Invalid - Block Data Access - Artifact: ${input.artifact_id}, Reason: EXPIRED, Expired At: ${artifact.expires_at}`);

      await prisma.consentValidation.create({
        data: {
          consent_artifact_id: input.artifact_id,
          requested_by: input.data_fiduciary_id,
          purpose_requested: input.purpose_id,
          is_valid: false,
          response_time_ms: Date.now() - startTime,
          remarks: "Consent expired",
        },
      });

      // Step 12a: TODO - Notify user to re-consent
      // await sendReconsentNotification(artifact.data_principal_id, input.data_fiduciary_id);

      return {
        success: true,
        message: "Consent validation completed",
        data: {
          is_valid: false,
          status: "EXPIRED",
          artifact_id: input.artifact_id,
          expires_at: artifact.expires_at,
          message: "Consent has expired",
        },
      };
    }

    // Step 5: Ensure consent not withdrawn or revoked
    if (artifact.status === "WITHDRAWN") {
      // Step 11a: Log "Consent Invalid - Block Data Access"
      logger.warn(`[VALIDATION-FAILED] Consent Invalid - Block Data Access - Artifact: ${input.artifact_id}, Reason: WITHDRAWN, Withdrawn At: ${artifact.withdrawn_at}`);

      await prisma.consentValidation.create({
        data: {
          consent_artifact_id: input.artifact_id,
          requested_by: input.data_fiduciary_id,
          purpose_requested: input.purpose_id,
          is_valid: false,
          response_time_ms: Date.now() - startTime,
          remarks: "Consent withdrawn",
        },
      });

      // Step 12a: TODO - Notify user to re-consent
      // await sendReconsentNotification(artifact.data_principal_id, input.data_fiduciary_id);

      return {
        success: true,
        message: "Consent validation completed",
        data: {
          is_valid: false,
          status: "WITHDRAWN",
          artifact_id: input.artifact_id,
          withdrawn_at: artifact.withdrawn_at || undefined,
          message: "Consent has been withdrawn",
        },
      };
    }

    // Step 6: Verify DF registration and purpose alignment
    if (input.purpose_id && artifact.purpose_id !== input.purpose_id) {
      logger.warn(`[VALIDATION-FAILED] Purpose Mismatch - Artifact: ${input.artifact_id}, Requested: ${input.purpose_id}, Actual: ${artifact.purpose_id}`);

      await prisma.consentValidation.create({
        data: {
          consent_artifact_id: input.artifact_id,
          requested_by: input.data_fiduciary_id,
          purpose_requested: input.purpose_id,
          is_valid: false,
          response_time_ms: Date.now() - startTime,
          remarks: "Purpose mismatch",
        },
      });

      return {
        success: true,
        message: "Consent validation completed",
        data: {
          is_valid: false,
          status: "ACTIVE",
          artifact_id: input.artifact_id,
          message: "Consent is valid but not for the requested purpose",
        },
      };
    }

    // Verify hash integrity (tamper detection)
    if (artifact.consent_text_hash) {
      const calculatedHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          purposes: artifact.purpose_id,
          data_fiduciary_id: artifact.data_fiduciary_id,
          granted_at: artifact.granted_at,
          version: "ART_5001",
        }))
        .digest("hex");

      // Note: In production, you might want to fail validation on hash mismatch
      if (calculatedHash !== artifact.consent_text_hash) {
        logger.error(`[VALIDATION-WARNING] Hash mismatch detected for artifact: ${input.artifact_id}. Possible tampering.`);
        // Could return invalid here for strict security
      } else {
        logger.info(`[VALIDATION-CHECK] Hash verification passed for artifact: ${input.artifact_id}`);
      }
    }

    // Step 16: Update "last_validated_at" timestamp
    await prisma.consentArtifact.update({
      where: { consent_artifact_id: input.artifact_id },
      data: { last_validated_at: new Date() },
    });

    // Step 7: Log "Validation Completed"
    await prisma.consentValidation.create({
      data: {
        consent_artifact_id: input.artifact_id,
        requested_by: input.data_fiduciary_id,
        purpose_requested: input.purpose_id,
        is_valid: true,
        response_time_ms: Date.now() - startTime,
        remarks: "Consent is valid",
      },
    });

    // Step 15: Append-only audit log (no PII, tamper-evident)
    await prisma.auditLog.create({
      data: {
        user_id: artifact.data_principal_id,
        purpose_id: artifact.purpose_id,
        consent_artifact_id: input.artifact_id,
        action: "VALIDATE",
        consent_status: artifact.status,
        initiator: "FIDUCIARY",
        audit_hash: generateAuditHash({
          action: "VALIDATE",
          artifact_id: input.artifact_id,
          timestamp: new Date(),
        }),
        details: {
          requested_purpose: input.purpose_id,
          validation_result: "valid",
          response_time_ms: Date.now() - startTime,
        },
      },
    });

    // Step 9: Log "Consent Verified Successfully"
    logger.info(`[VALIDATION-SUCCESS] Consent Verified Successfully - Artifact: ${input.artifact_id}, DF: ${input.data_fiduciary_id}, Response Time: ${Date.now() - startTime}ms`);

    return {
      success: true,
      message: "Consent is valid",
      data: {
        is_valid: true,
        status: "ACTIVE",
        artifact_id: input.artifact_id,
        data_principal_id: artifact.data_principal_id,
        purposes: [{
          purpose_id: artifact.purpose_version.purpose_id,
          purpose_version_id: artifact.purpose_version_id,
          title: artifact.purpose_version.title,
          is_valid: true,
        }],
        valid_till: artifact.expires_at || undefined,
        message: "Consent is active and valid",
      },
    };
  } catch (error) {
    logger.error("Error validating consent:", error);
    throw error;
  }
};

/**
 * Helper: Send webhook notification to data fiduciary
 */
async function sendWebhookNotification(
  webhookUrl: string | null,
  webhookSecret: string | null,
  payload: ConsentTypes.ConsentWebhookPayload,
  dataFiduciaryId: string
): Promise<void> {
  if (!webhookUrl) {
    logger.warn(`No webhook URL configured for fiduciary: ${dataFiduciaryId}`);
    return;
  }

  const startTime = Date.now();

  try {
    // Generate HMAC signature
    const signature = webhookSecret
      ? crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex")
      : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "DPDP-CMS/1.0",
    };

    if (signature) {
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    // Log webhook attempt
    await prisma.webhookLog.create({
      data: {
        data_fiduciary_id: dataFiduciaryId,
        event_type: payload.event_type,
        webhook_url: webhookUrl,
        method: "POST",
        headers,
        payload: payload as any,
        signature,
        status_code: response.status,
        response_body: responseBody,
        response_time_ms: responseTime,
        success: response.ok,
        error_message: response.ok ? null : `HTTP ${response.status}: ${responseBody}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    logger.info(`Webhook delivered successfully to ${webhookUrl}`);
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // Log failed webhook
    await prisma.webhookLog.create({
      data: {
        data_fiduciary_id: dataFiduciaryId,
        event_type: payload.event_type,
        webhook_url: webhookUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: payload as any,
        response_time_ms: responseTime,
        success: false,
        error_message: error.message,
      },
    });

    logger.error(`Webhook delivery failed: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Push failed webhook to dead letter queue
 */
async function pushToDeadLetterQueue(
  payload: ConsentTypes.ConsentWebhookPayload,
  dataFiduciaryId: string
): Promise<void> {
  try {
    // Create an alert for the failed webhook (DLQ)
    await prisma.alert.create({
      data: {
        data_fiduciary_id: dataFiduciaryId,
        consent_artifact_id: payload.artifact_id,
        event_type: payload.event_type,
        payload: payload as any,
        status: "FAILED",
        attempts: 0,
      },
    });

    logger.info(`Webhook pushed to DLQ for artifact: ${payload.artifact_id}`);
  } catch (error) {
    logger.error("Failed to push to DLQ:", error);
  }
}

/**
 * Helper: Generate audit hash
 */
function generateAuditHash(data: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

/**
 * Withdraw consent
 */
export const withdrawConsent = async (
  input: ConsentTypes.WithdrawConsentInput
): Promise<ConsentTypes.ApiResponse<ConsentTypes.WithdrawConsentResponse>> => {
  try {
    const artifact = await prisma.consentArtifact.findFirst({
      where: {
        consent_artifact_id: input.artifact_id,
        data_fiduciary_id: input.data_fiduciary_id,
        is_deleted: false,
      },
      include: {
        fiduciary: true,
      },
    });

    if (!artifact) {
      throw new AppError("Consent artifact not found", 404);
    }

    if (artifact.status === "WITHDRAWN") {
      throw new AppError("Consent has already been withdrawn", 400);
    }

    const withdrawnAt = new Date();

    // Update consent artifact
    const updated = await prisma.consentArtifact.update({
      where: { consent_artifact_id: input.artifact_id },
      data: {
        status: "WITHDRAWN",
        withdrawn_at: withdrawnAt,
        updated_at: withdrawnAt,
      },
    });

    // Create history record
    await prisma.consentHistory.create({
      data: {
        consent_artifact_id: input.artifact_id,
        action: "WITHDRAW",
        previous_status: artifact.status,
        new_status: "WITHDRAWN",
        performed_by: artifact.data_principal_id,
        performed_by_type: "principal",
        notes: input.reason || "Consent withdrawn by data principal",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: artifact.data_principal_id,
        purpose_id: artifact.purpose_id,
        consent_artifact_id: input.artifact_id,
        action: "DELETE",
        consent_status: "WITHDRAWN",
        initiator: "USER",
        audit_hash: generateAuditHash({
          action: "WITHDRAW",
          artifact_id: input.artifact_id,
          timestamp: withdrawnAt,
        }),
        details: {
          reason: input.reason,
        },
      },
    });

    // Send webhook notification
    const metadata = artifact.metadata as any;
    const webhookPayload: ConsentTypes.ConsentWebhookPayload = {
      event_type: "consent.withdrawn",
      artifact_id: input.artifact_id,
      data_fiduciary_id: input.data_fiduciary_id,
      user_id: metadata?.external_user_id,
      purposes: [{
        purpose_id: artifact.purpose_id,
        purpose_version_id: artifact.purpose_version_id,
        title: "Purpose", // You may want to fetch the actual title
      }],
      status: "WITHDRAWN",
      valid_till: artifact.expires_at || null,
      granted_at: artifact.granted_at!,
      withdrawn_at: withdrawnAt,
      metadata: {
        reason: input.reason,
      },
    };

    sendWebhookNotification(
      artifact.fiduciary.webhook_url,
      artifact.fiduciary.webhook_secret,
      webhookPayload,
      input.data_fiduciary_id
    ).catch(err => {
      logger.error("Webhook notification failed:", err);
    });

    logger.info(`Consent withdrawn: ${input.artifact_id}`);

    return {
      success: true,
      message: "Consent withdrawn successfully",
      data: {
        artifact_id: input.artifact_id,
        status: "WITHDRAWN",
        withdrawn_at: withdrawnAt,
        message: "Consent has been successfully withdrawn",
      },
    };
  } catch (error) {
    logger.error("Error withdrawing consent:", error);
    throw error;
  }
};

/**
 * List consents with filters and pagination
 */
export const listConsents = async (
  filters: ConsentTypes.ConsentListFilters
): Promise<ConsentTypes.ApiResponse<ConsentTypes.PaginatedResponse<ConsentTypes.ConsentArtifactDetail>>> => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
      status : "ACTIVE",
    };

    if (filters.data_fiduciary_id) {
      where.data_fiduciary_id = filters.data_fiduciary_id;
    }

    if (filters.data_principal_id) {
      where.data_principal_id = filters.data_principal_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.purpose_id) {
      where.purpose_id = filters.purpose_id;
    }

    if (filters.from_date || filters.to_date) {
      where.granted_at = {};
      if (filters.from_date) {
        where.granted_at.gte = filters.from_date;
      }
      if (filters.to_date) {
        where.granted_at.lte = filters.to_date;
      }
    }

    if (filters.external_user_id) {
      where.metadata = {
        path: ["external_user_id"],
        equals: filters.external_user_id,
      };
    }

    const [artifacts, total] = await Promise.all([
      prisma.consentArtifact.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || "granted_at"]: filters.sort_order || "desc",
        },
        include: {
          purpose_version: {
            select: {
              purpose_version_id: true,
              title: true,
            },
          },
        },
      }),
      prisma.consentArtifact.count({ where }),
    ]);

    const data = artifacts.map(artifact => {
      const metadata = artifact.metadata as any;
      return {
        consent_artifact_id: artifact.consent_artifact_id,
        data_fiduciary_id: artifact.data_fiduciary_id,
        data_principal_id: artifact.data_principal_id,
        principal_fiduciary_map_id: artifact.principal_fiduciary_map_id || undefined,
        external_user_id: metadata?.external_user_id,
        status: artifact.status as any,
        purposes: [{
          purpose_id: artifact.purpose_id,
          purpose_version_id: artifact.purpose_version_id,
          title: artifact.purpose_version.title,
          granted_at: artifact.granted_at!,
        }],
        requested_at: artifact.requested_at,
        granted_at: artifact.granted_at || undefined,
        expires_at: artifact.expires_at || undefined,
        withdrawn_at: artifact.withdrawn_at || undefined,
        last_validated_at: artifact.last_validated_at || undefined,
        consent_text_hash: artifact.consent_text_hash!,
        metadata: metadata,
        is_deleted: artifact.is_deleted,
      };
    });

    return {
      success: true,
      message: "Consents retrieved successfully",
      data: {
        data,
        meta: {
          pagination: {
            total,
            limit,
            current_page: page,
            total_pages: Math.ceil(total / limit),
          },
        },
      },
    };
  } catch (error) {
    logger.error("Error listing consents:", error);
    throw error;
  }
};

/**
 * Get consent by ID
 */
export const getConsentById = async (
  artifactId: string,
  dataFiduciaryId: string
): Promise<ConsentTypes.ApiResponse<ConsentTypes.ConsentArtifactDetail>> => {
  try {
    const artifact = await prisma.consentArtifact.findFirst({
      where: {
        consent_artifact_id: artifactId,
        data_fiduciary_id: dataFiduciaryId,
        is_deleted: false,
      },
      include: {
        purpose_version: {
          select: {
            purpose_version_id: true,
            title: true,
          },
        },
        fiduciary: {
          select: {
            name: true,
            legal_name: true,
          },
        },
        principal: {
          select: {
            data_principal_id: true,
            external_id: true,
          },
        },
      },
    });

    if (!artifact) {
      throw new AppError("Consent artifact not found", 404);
    }

    const metadata = artifact.metadata as any;

    return {
      success: true,
      message: "Consent retrieved successfully",
      data: {
        consent_artifact_id: artifact.consent_artifact_id,
        data_fiduciary_id: artifact.data_fiduciary_id,
        data_principal_id: artifact.data_principal_id,
        principal_fiduciary_map_id: artifact.principal_fiduciary_map_id || undefined,
        external_user_id: metadata?.external_user_id,
        status: artifact.status as any,
        purposes: [{
          purpose_id: artifact.purpose_id,
          purpose_version_id: artifact.purpose_version_id,
          title: artifact.purpose_version.title,
          granted_at: artifact.granted_at!,
        }],
        requested_at: artifact.requested_at,
        granted_at: artifact.granted_at || undefined,
        expires_at: artifact.expires_at || undefined,
        withdrawn_at: artifact.withdrawn_at || undefined,
        last_validated_at: artifact.last_validated_at || undefined,
        consent_text_hash: artifact.consent_text_hash!,
        metadata: metadata,
        is_deleted: artifact.is_deleted,
      },
    };
  } catch (error) {
    logger.error("Error getting consent:", error);
    throw error;
  }
};

/**
 * Get consent history
 */
export const getConsentHistory = async (
  artifactId: string,
  dataFiduciaryId: string,
  page: number = 1,
  limit: number = 20
): Promise<ConsentTypes.ApiResponse<ConsentTypes.PaginatedResponse<ConsentTypes.ConsentHistoryEntry>>> => {
  try {
    // Verify artifact belongs to fiduciary
    const artifact = await prisma.consentArtifact.findFirst({
      where: {
        consent_artifact_id: artifactId,
        data_fiduciary_id: dataFiduciaryId,
      },
    });

    if (!artifact) {
      throw new AppError("Consent artifact not found", 404);
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.consentHistory.findMany({
        where: { consent_artifact_id: artifactId },
        skip,
        take: limit,
        orderBy: { performed_at: "desc" },
      }),
      prisma.consentHistory.count({
        where: { consent_artifact_id: artifactId },
      }),
    ]);

    return {
      success: true,
      message: "Consent history retrieved successfully",
      data: {
        data: history.map(h => ({
          consent_history_id: h.consent_history_id,
          consent_artifact_id: h.consent_artifact_id,
          action: h.action as any,
          previous_status: h.previous_status as any,
          new_status: h.new_status as any,
          performed_by: h.performed_by || undefined,
          performed_by_type: h.performed_by_type || undefined,
          performed_at: h.performed_at,
          notes: h.notes || undefined,
        })),
        meta: {
          pagination: {
            total,
            limit,
            current_page: page,
            total_pages: Math.ceil(total / limit),
          },
        },
      },
    };
  } catch (error) {
    logger.error("Error getting consent history:", error);
    throw error;
  }
};

/**
 * Initiate renewal request
 * POST /api/v1/consents/renew
 * Supports both user-initiated and fiduciary-initiated renewal
 * Supports granular renewal (specific purposes)
 *
 * @param {ConsentTypes.InitiateRenewalInput} input - Renewal initiation input
 * @returns {Promise<ConsentTypes.ApiResponse<ConsentTypes.InitiateRenewalResponse>>}
 */
export const initiateRenewal = async (
  input: ConsentTypes.InitiateRenewalInput
): Promise<ConsentTypes.ApiResponse<ConsentTypes.InitiateRenewalResponse>> => {
  try {
    const initiatedBy = input.initiated_by || "FIDUCIARY";

    console.log("input", input);

    // Calculate new expiry date
    let extendByDays = 365; // Default 1 year
    if (input.extend_by_days) {
      extendByDays = input.extend_by_days;
    } else if (input.requested_extension) {
      const extensionMatch = input.requested_extension.match(/^\+(\d+)d$/);
      if (extensionMatch) {
        extendByDays = parseInt(extensionMatch[1], 10);
      }
    }

    let artifacts: any[] = [];
    let renewalRequestId = crypto.randomUUID();

    // Case 1: Specific artifact renewal
    if (input.artifact_id) {
      const artifact = await prisma.consentArtifact.findFirst({
        where: {
          consent_artifact_id: input.artifact_id,
          data_fiduciary_id: input.data_fiduciary_id,
          is_deleted: false,
        },
        include: {
          fiduciary: true,
          principal: true,
          purpose_version: {
            include: {
              purpose: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!artifact) {
        throw new AppError("Consent artifact not found", 404);
      }

      // Validate artifact is ACTIVE or EXPIRED (allow renewal of expired consents)
      if (artifact.status !== "ACTIVE" && artifact.status !== "EXPIRED") {
        throw new AppError("Only active or expired consents can be renewed", 400);
      }

      // Granular renewal: validate purpose_ids if provided
      if (input.purpose_ids && input.purpose_ids.length > 0) {
        if (!input.purpose_ids.includes(artifact.purpose_id)) {
          throw new AppError("Specified purpose_ids do not match the artifact", 400);
        }
      }

      artifacts = [artifact];
    }
    // Case 2: User-initiated renewal (by external_user_id or data_principal_id)
    else if (input.external_user_id || input.data_principal_id) {
      const where: any = {
        is_deleted: false,
        status: "ACTIVE",
        expires_at: {
          gte: new Date(), // Not expired
        },
      };

      if (input.data_fiduciary_id) {
        where.data_fiduciary_id = input.data_fiduciary_id;
      }

      // Find principal
      let principal;
      if (input.data_principal_id) {
        principal = await prisma.dataPrincipal.findUnique({
          where: { data_principal_id: input.data_principal_id },
        });
      } else if (input.external_user_id) {
        principal = await prisma.dataPrincipal.findUnique({
          where: { external_id: input.external_user_id },
        });
      }

      if (!principal) {
        throw new AppError("Data principal not found", 404);
      }

      where.data_principal_id = principal.data_principal_id;

      // If purpose_ids specified, filter by purposes
      if (input.purpose_ids && input.purpose_ids.length > 0) {
        where.purpose_id = { in: input.purpose_ids };
      }

      artifacts = await prisma.consentArtifact.findMany({
        where,
        include: {
          fiduciary: true,
          principal: true,
          purpose_version: {
            include: {
              purpose: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (artifacts.length === 0) {
        throw new AppError("No active consents found for renewal", 404);
      }
    } else {
      throw new AppError("Either consent_artifact_id (or artifact_id) or (external_user_id/data_principal_id) must be provided", 400);
    }

    // Process each artifact for renewal request
    const artifactIds: string[] = [];
    let currentExpiresAt: Date | undefined;
    const requestedExpiresAt = new Date();
    const now = new Date();

    for (const artifact of artifacts) {
      artifactIds.push(artifact.consent_artifact_id);
      // If consent is expired, use current date as base; otherwise use expires_at
      const artifactExpiresAt = artifact.expires_at && artifact.expires_at >= now
        ? artifact.expires_at
        : now;
      if (!currentExpiresAt || artifactExpiresAt < currentExpiresAt) {
        currentExpiresAt = artifactExpiresAt;
      }
    }

    // Calculate new expiry: if expired, extend from today; otherwise extend from current expiry
    requestedExpiresAt.setTime(currentExpiresAt!.getTime());
    requestedExpiresAt.setDate(requestedExpiresAt.getDate() + extendByDays);

    // Apply renewal to each artifact
    for (const artifact of artifacts) {
      const metadata = artifact.metadata as any;
      const previousExpiresAt = artifact.expires_at;

      // Calculate new expiry for this specific artifact
      const artifactCurrentExpiry = artifact.expires_at && artifact.expires_at >= now
        ? artifact.expires_at
        : now;
      const newExpiresAt = new Date(artifactCurrentExpiry);
      newExpiresAt.setDate(newExpiresAt.getDate() + extendByDays);

      // Update artifact with new expiry and store renewal metadata
      await prisma.consentArtifact.update({
        where: { consent_artifact_id: artifact.consent_artifact_id },
        data: {
          expires_at: newExpiresAt,
          status: "ACTIVE", // Reactivate if it was expired
          metadata: {
            ...metadata,
            renewal_history: [
              ...(metadata?.renewal_history || []),
              {
                renewal_request_id: renewalRequestId,
                renewed_at: new Date(),
                extension_days: extendByDays,
                previous_expires_at: previousExpiresAt,
                new_expires_at: newExpiresAt,
                initiated_by: initiatedBy,
                purpose_ids: input.purpose_ids || [artifact.purpose_id],
              }
            ],
          },
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          user_id: artifact.data_principal_id,
          consent_artifact_id: artifact.consent_artifact_id,
          action: "UPDATE",
          consent_status: "ACTIVE",
          initiator: initiatedBy === "USER" ? "USER" : "FIDUCIARY",
          audit_hash: generateAuditHash({
            action: "RENEWAL_EXTENDED",
            artifact_id: artifact.consent_artifact_id,
            timestamp: new Date(),
          }),
          details: {
            renewal_request_id: renewalRequestId,
            extension_days: extendByDays,
            previous_expires_at: previousExpiresAt,
            new_expires_at: newExpiresAt,
            purpose_ids: input.purpose_ids || [artifact.purpose_id],
          },
        },
      });
    }

    // Get transparency information (retention policies, etc.)
    const firstArtifact = artifacts[0];
    const purpose = firstArtifact.purpose_version.purpose;
    const transparencyInfo: ConsentTypes.InitiateRenewalResponse["transparency_info"] = {
      retention_policy_changes: `Retention period: ${purpose.retention_period_days || 365} days`,
      purpose_changes: purpose.title,
      data_field_changes: purpose.data_fields?.join(", ") || "No changes",
      other_changes: `Extension period: ${extendByDays} days`,
    };

    logger.info(`Consent Renewal Completed - Request ID: ${renewalRequestId}, Artifacts: ${artifactIds.length}, Extended by: ${extendByDays} days, Initiated by: ${initiatedBy}`);

    return {
      success: true,
      message: "Consent renewal completed successfully",
      data: {
        renewal_request_id: renewalRequestId,
        artifact_id: artifactIds.length === 1 ? artifactIds[0] : undefined,
        artifact_ids: artifactIds.length > 1 ? artifactIds : undefined,
        status: "RENEWAL_EXTENDED" as const,
        current_expires_at: currentExpiresAt,
        requested_expires_at: requestedExpiresAt,
        transparency_info: transparencyInfo,
        message: `Consent renewed successfully. Extended by ${extendByDays} days. New expiry: ${requestedExpiresAt.toISOString()}`,
      },
    };
  } catch (error) {
    logger.error("Error initiating renewal:", error);
    throw error;
  }
};