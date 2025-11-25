/**
 * @fileoverview Zod validation schemas for Consent Collection operations.
 * @module modules/consent/validators
 */

import { z } from "zod";

/**
 * Schema for initiating a consent request
 * POST /api/v1/consents/initiate
 */
export const InitiateConsentSchema = z.object({
  body: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    user_id: z.string().min(1, "User ID is required"),
    purposes: z.array(z.string().uuid("Invalid purpose ID")).min(1, "At least one purpose is required"),
    duration: z.number().int().positive("Duration must be positive").optional(),
    metadata: z.record(z.any()).optional(),
    language: z.string().min(2).max(5).default("en"),
    redirect_url: z.string().url("Invalid redirect URL").optional(),
  }),
}).transform(({ body }) => body);

/**
 * Schema for getting consent notice by request ID
 * GET /consents/:cms_request_id
 */
export const GetConsentNoticeSchema = z.object({
  params: z.object({
    cms_request_id: z.string().uuid("Invalid consent request ID"),
  }),
  query: z.object({
    language: z.string().min(2).max(5).optional(),
  }).optional(),
}).transform(({ params, query }) => ({
  cms_request_id: params.cms_request_id,
  language: query?.language || "en",
}));

/**
 * Schema for submitting consent
 * POST /api/v1/consents/submit
 */
export const SubmitConsentSchema = z.object({
  body: z.object({
    cms_request_id: z.string().uuid("Invalid consent request ID"),
    selected_purposes: z.array(z.string().uuid("Invalid purpose ID")).min(1, "At least one purpose must be selected"),
    agree: z.boolean(),
    language_code: z.string().min(2).max(5).optional().default("en"),
    ip_address: z.string().ip().optional(),
    user_agent: z.string().optional(),
  }).refine((data) => data.agree === true, {
    message: "You must agree to proceed",
    path: ["agree"],
  }),
}).transform(({ body }) => body);

/**
 * Schema for validating consent artifact
 * GET /api/v1/consents/validate
 */
export const ValidateConsentSchema = z.object({
  query: z.object({
    artifact_id: z.string().uuid("Invalid artifact ID"),
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_id: z.string().uuid("Invalid purpose ID").optional(),
  }),
}).transform(({ query }) => query);

/**
 * Schema for getting consent artifact by ID
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id
 */
export const GetConsentByIdSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    artifact_id: z.string().uuid("Invalid artifact ID"),
  }),
}).transform(({ params }) => params);

/**
 * Schema for listing consents with filters
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents
 */
export const ListConsentsSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  query: z.object({
    data_principal_id: z.string().uuid().optional(),
    external_user_id: z.string().optional(),
    status: z.enum(["PENDING", "ACTIVE", "WITHDRAWN", "EXPIRED"]).optional(),
    purpose_id: z.string().uuid().optional(),
    from_date: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    to_date: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    sort_by: z.string().optional().default("granted_at"),
    sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  ...query,
}));

/**
 * Schema for withdrawing consent
 * POST /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/withdraw
 */
export const WithdrawConsentSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    artifact_id: z.string().uuid("Invalid artifact ID"),
  }),
  body: z.object({
    reason: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
}).transform(({ params, body }) => ({
  artifact_id: params.artifact_id,
  data_fiduciary_id: params.data_fiduciary_id,
  reason: body?.reason,
  notes: body?.notes,
}));

/**
 * Schema for renewing consent
 * POST /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/renew
 */
export const RenewConsentSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    artifact_id: z.string().uuid("Invalid artifact ID"),
  }),
  body: z.object({
    extend_by_days: z.number().int().positive("Extension period must be positive").optional(),
  }).optional(),
}).transform(({ params, body }) => ({
  artifact_id: params.artifact_id,
  data_fiduciary_id: params.data_fiduciary_id,
  extend_by_days: body?.extend_by_days,
}));

/**
 * Schema for getting consent history
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/history
 */
export const GetConsentHistorySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    artifact_id: z.string().uuid("Invalid artifact ID"),
  }),
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  }).optional(),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  artifact_id: params.artifact_id,
  page: query?.page || 1,
  limit: query?.limit || 20,
}));

/**
 * Schema for getting consent analytics
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/analytics
 */
export const GetConsentAnalyticsSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  query: z.object({
    from_date: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    to_date: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
    purpose_id: z.string().uuid().optional(),
  }).optional(),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  from_date: query?.from_date,
  to_date: query?.to_date,
  purpose_id: query?.purpose_id,
}));

/**
 * Schema for getting user consents by external user ID
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/users/:external_user_id/consents
 */
export const GetUserConsentsSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    external_user_id: z.string().min(1, "External user ID is required"),
  }),
  query: z.object({
    status: z.enum(["PENDING", "ACTIVE", "WITHDRAWN", "EXPIRED"]).optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  }).optional(),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  external_user_id: params.external_user_id,
  status: query?.status,
  page: query?.page || 1,
  limit: query?.limit || 10,
}));

/**
 * Schema for bulk consent validation
 * POST /api/v1/consents/validate-bulk
 */
export const ValidateBulkConsentsSchema = z.object({
  body: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    validations: z.array(z.object({
      artifact_id: z.string().uuid("Invalid artifact ID"),
      purpose_id: z.string().uuid("Invalid purpose ID").optional(),
    })).min(1).max(100, "Maximum 100 consents can be validated at once"),
  }),
}).transform(({ body }) => body);

/**
 * Schema for webhook retry
 * POST /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/webhook-retry
 */
export const WebhookRetrySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    artifact_id: z.string().uuid("Invalid artifact ID"),
  }),
}).transform(({ params }) => params);
