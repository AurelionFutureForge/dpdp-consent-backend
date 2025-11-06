/**
 * @fileoverview Data fiduciary service for handling business logic related to data fiduciary management.
 * @module modules/data-fiduciary/services
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import { DataFiduciaryTypes } from "@/modules/data-fiduciary";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate a secure random API key.
 * Format: df_live_<random_hex_string> or df_test_<random_hex_string>
 * 
 * @param isTest - Whether this is a test key (default: false)
 * @returns API key string
 */
const generateApiKey = (isTest: boolean = false): string => {
  const prefix = isTest ? "df_test_" : "df_live_";
  const randomHex = crypto.randomBytes(24).toString("hex"); // 48 characters
  return `${prefix}${randomHex}`;
};

/**
 * Generate a secure random API secret.
 * 
 * @returns API secret string (32 bytes = 64 hex characters)
 */
const generateApiSecret = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash API secret using bcrypt for secure storage.
 * 
 * @param secret - Plain text API secret
 * @returns Hashed secret
 */
const hashApiSecret = async (secret: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(secret, saltRounds);
};

/**
 * Handles data fiduciary registration.
 * Creates a new data fiduciary entity with API credentials.
 * 
 * @param data - Registration data from request
 * @returns Registration response containing data fiduciary info and API credentials
 */
export const handleRegisterDataFiduciary = async (data: DataFiduciaryTypes.RegisterDataFiduciaryRequest): Promise<DataFiduciaryTypes.RegisterDataFiduciaryResponse> => {
  try {
    // Check if contact email is already registered
    const existingFiduciary = await prisma.dataFiduciary.findFirst({
      where: {
        contact_email: data.contact_email,
        is_deleted: false,
      },
    });

    if (existingFiduciary) {
      throw new AppError("A data fiduciary with this contact email already exists", 409);
    }

    // Check if registration number is already in use (if provided)
    if (data.registration_number) {
      const existingByRegNumber = await prisma.dataFiduciary.findFirst({
        where: {
          registration_number: data.registration_number,
          is_deleted: false,
        },
      });

      if (existingByRegNumber) {
        throw new AppError("This registration number is already in use", 409);
      }
    }

    // Generate API credentials
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();
    const hashedApiSecret = await hashApiSecret(apiSecret);

    // Create data fiduciary record with transaction to include platform submission
    const dataFiduciaryId = uuidv4();
    
    await prisma.$transaction(async (tx) => {
      // Create data fiduciary record
      const dataFiduciary = await tx.dataFiduciary.create({
        data: {
          data_fiduciary_id: dataFiduciaryId,
          name: data.name,
          legal_name: data.legal_name,
          registration_number: data.registration_number,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          dpo_email: data.dpo_email,
          dpo_phone: data.dpo_phone,
          website_url: data.website_url,
          api_key: apiKey,
          api_secret: hashedApiSecret,
          rate_limit_per_min: data.rate_limit_per_min ?? 1000,
          rate_limit_per_day: data.rate_limit_per_day ?? 100000,
          logo_url: data.logo_url,
          privacy_policy_url: data.privacy_policy_url,
          terms_url: data.terms_url,
          gdpr_compliant: data.gdpr_compliant ?? false,
          dpdp_compliant: data.dpdp_compliant ?? true,
          is_public: true,
          is_active: false, // Requires admin approval
          is_deleted: false,
        },
        select: {
          data_fiduciary_id: true,
          name: true,
          legal_name: true,
          registration_number: true,
          contact_email: true,
          api_key: true,
          rate_limit_per_min: true,
          rate_limit_per_day: true,
          is_active: true,
          created_at: true,
        },
      });

      // Create platform submission for website if provided
      if (data.website_url) {
        await tx.platformSubmission.create({
          data: {
            platform_submission_id: uuidv4(),
            data_fiduciary_id: dataFiduciaryId,
            platform_type: "WEBSITE",
            url: data.website_url,
            description: `Official website for ${data.name}`,
            status: "SUBMITTED", // Submitted for admin review
            submitted_at: new Date(),
          },
        });
      }

      return dataFiduciary;
    });

    return {
      success: true,
      status: 201,
      message: "Data fiduciary registered successfully. Account is pending admin approval.",
      data: null
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Handles creating or updating webhook configuration for a data fiduciary.
 * 
 * @param data - Webhook configuration data
 * @returns Webhook response
 */
export const handleCreateWebhook = async (data: DataFiduciaryTypes.CreateWebhookRequest): Promise<DataFiduciaryTypes.WebhookResponse> => {
  try {
    // Check if data fiduciary exists
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id: data.data_fiduciary_id },
      select: {
        data_fiduciary_id: true,
        is_active: true,
        is_deleted: true
      },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (fiduciary.is_deleted) {
      throw new AppError("Data fiduciary has been deleted", 403);
    }

    if (!fiduciary.is_active) {
      throw new AppError("Data fiduciary is inactive", 403);
    }

    // Update webhook configuration
    const updatedFiduciary = await prisma.dataFiduciary.update({
      where: { data_fiduciary_id: data.data_fiduciary_id },
      data: {
        webhook_url: data.webhook_url,
        webhook_secret: data.webhook_secret,
      },
      select: {
        data_fiduciary_id: true,
        webhook_url: true,
        updated_at: true,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`✅ Webhook configured for: ${data.data_fiduciary_id}`);
    }

    return {
      status: 200,
      success: true,
      message: "Webhook configuration updated successfully",
      data: {
        data_fiduciary_id: updatedFiduciary.data_fiduciary_id,
        webhook_url: updatedFiduciary.webhook_url!,
        updated_at: updatedFiduciary.updated_at,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves webhook configuration for a data fiduciary.
 * 
 * @param data_fiduciary_id - Data fiduciary ID
 * @returns Webhook configuration
 */
export const handleGetWebhook = async (data_fiduciary_id: string): Promise<DataFiduciaryTypes.GetWebhooksResponse> => {
  try {
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id },
      select: {
        data_fiduciary_id: true,
        name: true,
        webhook_url: true,
        is_active: true,
        is_deleted: true,
        last_api_call: true,
        updated_at: true,
      },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (fiduciary.is_deleted) {
      throw new AppError("Data fiduciary has been deleted", 403);
    }

    return {
      status: 200,
      success: true,
      message: "Webhook configuration retrieved successfully",
      data: {
        data_fiduciary_id: fiduciary.data_fiduciary_id,
        name: fiduciary.name,
        webhook_url: fiduciary.webhook_url ?? undefined,
        is_active: fiduciary.is_active,
        last_api_call: fiduciary.last_api_call ?? undefined,
        updated_at: fiduciary.updated_at,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves webhook logs for a data fiduciary.
 * 
 * @param data_fiduciary_id - Data fiduciary ID
 * @param limit - Maximum number of logs to return
 * @param offset - Number of logs to skip
 * @returns Webhook logs
 */
export const handleGetWebhookLogs = async (data_fiduciary_id: string, limit: number = 50, offset: number = 0): Promise<DataFiduciaryTypes.GetWebhookLogsResponse> => {
  try {
    // Check if data fiduciary exists
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id },
      select: {
        data_fiduciary_id: true,
        is_deleted: true
      },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (fiduciary.is_deleted) {
      throw new AppError("Data fiduciary has been deleted", 403);
    }

    // Get total count of logs
    const totalLogs = await prisma.webhookLog.count({
      where: { data_fiduciary_id },
    });

    // Retrieve webhook logs with pagination
    const logs = await prisma.webhookLog.findMany({
      where: { data_fiduciary_id },
      select: {
        webhook_log_id: true,
        event_type: true,
        webhook_url: true,
        method: true,
        status_code: true,
        response_time_ms: true,
        success: true,
        error_message: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      status: 200,
      success: true,
      message: "Webhook logs retrieved successfully",
      data: {
        data_fiduciary_id,
        total_logs: totalLogs,
        logs: logs.map(log => ({
          webhook_log_id: log.webhook_log_id,
          event_type: log.event_type,
          webhook_url: log.webhook_url,
          method: log.method,
          status_code: log.status_code ?? undefined,
          response_time_ms: log.response_time_ms ?? undefined,
          success: log.success,
          error_message: log.error_message ?? undefined,
          created_at: log.created_at,
        })),
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves complete data fiduciary profile information by ID.
 * Used for profile page display.
 * 
 * @param data_fiduciary_id - Data fiduciary ID
 * @returns Complete data fiduciary profile
 */
export const handleGetDataFiduciaryById = async (data_fiduciary_id: string): Promise<DataFiduciaryTypes.GetDataFiduciaryProfileResponse> => {
  try {
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id },
      select: {
        data_fiduciary_id: true,
        name: true,
        legal_name: true,
        registration_number: true,
        
        // Contact Information
        contact_email: true,
        contact_phone: true,
        dpo_email: true,
        dpo_phone: true,
        website_url: true,
        
        // API Configuration
        api_key: true,
        webhook_url: true,
        
        // Rate Limiting
        rate_limit_per_min: true,
        rate_limit_per_day: true,
        
        // Settings & Status
        is_public: true,
        is_active: true,
        is_deleted: true,
        
        // Branding
        logo_url: true,
        
        // Compliance
        privacy_policy_url: true,
        terms_url: true,
        gdpr_compliant: true,
        dpdp_compliant: true,
        
        // Timestamps
        created_at: true,
        updated_at: true,
        last_api_call: true,
      },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (fiduciary.is_deleted) {
      throw new AppError("Data fiduciary has been deleted", 403);
    }

    return {
      status: 200,
      success: true,
      message: "Data fiduciary profile retrieved successfully",
      data: {
        data_fiduciary_id: fiduciary.data_fiduciary_id,
        name: fiduciary.name,
        legal_name: fiduciary.legal_name,
        registration_number: fiduciary.registration_number ?? undefined,
        
        // Contact Information
        contact_email: fiduciary.contact_email,
        contact_phone: fiduciary.contact_phone ?? undefined,
        dpo_email: fiduciary.dpo_email ?? undefined,
        dpo_phone: fiduciary.dpo_phone ?? undefined,
        website_url: fiduciary.website_url ?? undefined,
        
        // API Configuration
        api_key: fiduciary.api_key,
        webhook_url: fiduciary.webhook_url ?? undefined,
        
        // Rate Limiting
        rate_limit_per_min: fiduciary.rate_limit_per_min,
        rate_limit_per_day: fiduciary.rate_limit_per_day,
        
        // Settings & Status
        is_public: fiduciary.is_public,
        is_active: fiduciary.is_active,
        is_deleted: fiduciary.is_deleted,
        
        // Branding
        logo_url: fiduciary.logo_url ?? undefined,
        
        // Compliance
        privacy_policy_url: fiduciary.privacy_policy_url ?? undefined,
        terms_url: fiduciary.terms_url ?? undefined,
        gdpr_compliant: fiduciary.gdpr_compliant,
        dpdp_compliant: fiduciary.dpdp_compliant,
        
        // Timestamps
        created_at: fiduciary.created_at,
        updated_at: fiduciary.updated_at,
        last_api_call: fiduciary.last_api_call ?? undefined,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Handles approving a data fiduciary registration.
 * Activates the data fiduciary account and approves the platform submission(s).
 * 
 * @param data - Approval data from request
 * @returns Approval response
 */
export const handleApproveDataFiduciary = async (data: DataFiduciaryTypes.ApproveDataFiduciaryRequest): Promise<DataFiduciaryTypes.ApproveDataFiduciaryResponse> => {
  try {
    // Check if data fiduciary exists
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id: data.data_fiduciary_id },
      select: {
        data_fiduciary_id: true,
        name: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    if (fiduciary.is_deleted) {
      throw new AppError("Data fiduciary has been deleted", 403);
    }

    if (fiduciary.is_active) {
      throw new AppError("Data fiduciary is already active", 400);
    }

    const approvalTime = new Date();

    // Update data fiduciary and platform submissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Activate the data fiduciary
      const updatedFiduciary = await tx.dataFiduciary.update({
        where: { data_fiduciary_id: data.data_fiduciary_id },
        data: {
          is_active: true,
          activated_by: data.approved_by_user_id,
          activated_at: approvalTime,
        },
        select: {
          data_fiduciary_id: true,
          name: true,
          legal_name: true,
          contact_email: true,
          is_active: true,
          activated_by: true,
          activated_at: true,
          updated_at: true,
        },
      });

      // Approve all SUBMITTED platform submissions (typically the website)
      const updatedSubmissions = await tx.platformSubmission.updateMany({
        where: {
          data_fiduciary_id: data.data_fiduciary_id,
          status: "SUBMITTED",
        },
        data: {
          status: "APPROVED",
          reviewed_by: data.approved_by_user_id,
          reviewed_at: approvalTime,
          approved_by: data.approved_by_user_id,
          approved_at: approvalTime,
          review_notes: data.approval_notes,
        },
      });

      return { updatedFiduciary, approvedSubmissionsCount: updatedSubmissions.count };
    });

    return {
      success: true,
      status: 200,
      message: "Data fiduciary approved and activated successfully",
      data: {
        data_fiduciary_id: result.updatedFiduciary.data_fiduciary_id,
        name: result.updatedFiduciary.name,
        legal_name: result.updatedFiduciary.legal_name,
        contact_email: result.updatedFiduciary.contact_email,
        is_active: result.updatedFiduciary.is_active,
        activated_by: result.updatedFiduciary.activated_by!,
        activated_at: result.updatedFiduciary.activated_at!,
        approved_submissions_count: result.approvedSubmissionsCount,
        updated_at: result.updatedFiduciary.updated_at,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all data fiduciaries in review with pagination, search, and filtering.
 * Only returns data fiduciaries that are pending approval (is_active = false, is_deleted = false).
 * 
 * @param page - Page number for pagination (default is 1).
 * @param limit - Number of items per page (default is 10).
 * @param q - Search term for filtering by name, legal_name, or contact_email.
 * @param dpdp_compliant - Filter by DPDP compliance status.
 * @param gdpr_compliant - Filter by GDPR compliance status.
 * @param sort_by - Field to sort by (default: 'created_at').
 * @param sort_order - Sort order (default: 'desc').
 * 
 * @returns API response with paginated list of data fiduciaries in review.
 */
export const getAllDataFiduciariesInReview = async (
  page: number = 1,
  limit: number = 10,
  q?: string,
  dpdp_compliant?: boolean,
  gdpr_compliant?: boolean,
  sort_by: string = "created_at",
  sort_order: "asc" | "desc" = "desc"
): Promise<DataFiduciaryTypes.ApiResponse<DataFiduciaryTypes.PaginatedDataFiduciaryInReviewResponse>> => {
  try {
    const skip = (page - 1) * limit;

    // Build where clause - only include data fiduciaries pending approval
    const where: any = {
      is_active: false,  // Not yet activated/approved
      is_deleted: false, // Not deleted
    };

    // Add search functionality
    if (q) {
      const searchTerms = q.split(/\s+/).filter(Boolean);

      if (searchTerms.length > 0) {
        where.OR = [
          ...searchTerms.map((term) => ({
            name: { contains: term, mode: "insensitive" },
          })),
          ...searchTerms.map((term) => ({
            legal_name: { contains: term, mode: "insensitive" },
          })),
          ...searchTerms.map((term) => ({
            contact_email: { contains: term, mode: "insensitive" },
          })),
        ];
      }
    }

    // Add compliance filters
    if (dpdp_compliant !== undefined) {
      where.dpdp_compliant = dpdp_compliant;
    }

    if (gdpr_compliant !== undefined) {
      where.gdpr_compliant = gdpr_compliant;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // Get data fiduciaries with counts of associated platform submissions
    const fiduciaries = await prisma.dataFiduciary.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        data_fiduciary_id: true,
        name: true,
        legal_name: true,
        registration_number: true,
        contact_email: true,
        contact_phone: true,
        website_url: true,
        is_active: true,
        dpdp_compliant: true,
        gdpr_compliant: true,
        created_at: true,
        _count: {
          select: { platform_submissions: true },
        },
      },
    });

    // Get total count for current query
    const totalFiduciaries = await prisma.dataFiduciary.count({ where });

    // Transform fiduciaries to rename _count
    const transformedFiduciaries = fiduciaries.map(({ _count, ...fiduciary }) => ({
      ...fiduciary,
      registration_number: fiduciary.registration_number ?? undefined,
      contact_phone: fiduciary.contact_phone ?? undefined,
      website_url: fiduciary.website_url ?? undefined,
      total_platform_submissions: _count.platform_submissions,
    }));

    return {
      success: true,
      message: "Data fiduciaries in review retrieved successfully",
      data: {
        data: transformedFiduciaries,
        meta: {
          pagination: {
            total_fiduciaries: totalFiduciaries,
            limit,
            current_page: page,
            total_pages: Math.ceil(totalFiduciaries / limit),
          },
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves analytics for data fiduciaries in review.
 * Provides statistics about pending approvals, compliance breakdown, and recent submissions.
 * 
 * @returns API response with analytics data for data fiduciaries in review.
 */
export const getDataFiduciaryInReviewAnalytics = async (): Promise<DataFiduciaryTypes.ApiResponse<DataFiduciaryTypes.DataFiduciaryInReviewAnalytics>> => {
  try {
    // Base filter for data fiduciaries in review
    const inReviewFilter = {
      is_active: false,
      is_deleted: false,
    };

    // Get total count of data fiduciaries in review
    const totalInReview = await prisma.dataFiduciary.count({
      where: inReviewFilter,
    });

    // Get compliance breakdown
    const [dpdpCompliant, gdprCompliant, bothCompliant, noneCompliant] = await Promise.all([
      prisma.dataFiduciary.count({
        where: { ...inReviewFilter, dpdp_compliant: true },
      }),
      prisma.dataFiduciary.count({
        where: { ...inReviewFilter, gdpr_compliant: true },
      }),
      prisma.dataFiduciary.count({
        where: { ...inReviewFilter, dpdp_compliant: true, gdpr_compliant: true },
      }),
      prisma.dataFiduciary.count({
        where: { ...inReviewFilter, dpdp_compliant: false, gdpr_compliant: false },
      }),
    ]);

    // Get recent submission counts
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [submissionsLast7Days, submissionsLast30Days, submissionsLast90Days] = await Promise.all([
      prisma.dataFiduciary.count({
        where: {
          ...inReviewFilter,
          created_at: { gte: last7Days },
        },
      }),
      prisma.dataFiduciary.count({
        where: {
          ...inReviewFilter,
          created_at: { gte: last30Days },
        },
      }),
      prisma.dataFiduciary.count({
        where: {
          ...inReviewFilter,
          created_at: { gte: last90Days },
        },
      }),
    ]);

    // Get oldest pending data fiduciary
    const oldestPending = await prisma.dataFiduciary.findFirst({
      where: inReviewFilter,
      orderBy: { created_at: 'asc' },
      select: {
        data_fiduciary_id: true,
        name: true,
        created_at: true,
      },
    });

    // Calculate days pending for oldest
    let oldestPendingData = null;
    if (oldestPending) {
      const daysPending = Math.floor(
        (now.getTime() - oldestPending.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );
      oldestPendingData = {
        data_fiduciary_id: oldestPending.data_fiduciary_id,
        name: oldestPending.name,
        days_pending: daysPending,
        created_at: oldestPending.created_at,
      };
    }

    return {
      success: true,
      message: "Data fiduciary in review analytics retrieved successfully",
      data: {
        total_in_review: totalInReview,
        total_pending_approval: totalInReview, // Same as in review for this context
        by_compliance: {
          dpdp_compliant: dpdpCompliant,
          gdpr_compliant: gdprCompliant,
          both_compliant: bothCompliant,
          none_compliant: noneCompliant,
        },
        recent_submissions: {
          last_7_days: submissionsLast7Days,
          last_30_days: submissionsLast30Days,
          last_90_days: submissionsLast90Days,
        },
        oldest_pending: oldestPendingData,
      },
    };
  } catch (error) {
    throw error;
  }
};