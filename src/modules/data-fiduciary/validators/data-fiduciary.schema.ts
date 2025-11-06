import { z } from "zod";

/**
 * Schema for data fiduciary registration validation.
 * Validates all required and optional fields for registering a new data fiduciary.
 */
export const RegisterDataFiduciarySchema = z.object({
  // Required fields
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
  
  legal_name: z
    .string()
    .min(1, "Legal name is required")
    .max(255, "Legal name must not exceed 255 characters"),
  
  contact_email: z
    .string()
    .email("Invalid email format")
    .min(1, "Contact email is required"),
  
  // Optional fields
  registration_number: z
    .string()
    .max(100, "Registration number must not exceed 100 characters")
    .optional(),
  
  contact_phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164 format recommended)")
    .optional(),
  
  dpo_email: z
    .string()
    .email("Invalid DPO email format")
    .optional(),
  
  dpo_phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid DPO phone number format (E.164 format recommended)")
    .optional(),
  
  website_url: z
    .string()
    .url("Invalid website URL format")
    .optional(),
  
  rate_limit_per_min: z
    .number()
    .int("Rate limit per minute must be an integer")
    .min(1, "Rate limit per minute must be at least 1")
    .max(100000, "Rate limit per minute must not exceed 100,000")
    .optional(),
  
  rate_limit_per_day: z
    .number()
    .int("Rate limit per day must be an integer")
    .min(1, "Rate limit per day must be at least 1")
    .max(10000000, "Rate limit per day must not exceed 10,000,000")
    .optional(),
  
  logo_url: z
    .string()
    .url("Invalid logo URL format")
    .optional(),
  
  privacy_policy_url: z
    .string()
    .url("Invalid privacy policy URL format")
    .optional(),
  
  terms_url: z
    .string()
    .url("Invalid terms URL format")
    .optional(),
  
  gdpr_compliant: z
    .boolean()
    .optional(),
  
  dpdp_compliant: z
    .boolean()
    .optional(),
});

/**
 * Schema for creating webhook configuration.
 */
export const CreateWebhookSchema = z.object({
  data_fiduciary_id: z
    .string()
    .uuid("Invalid data fiduciary ID format"),
  
  webhook_url: z
    .string()
    .url("Invalid webhook URL format")
    .min(1, "Webhook URL is required"),
  
  webhook_secret: z
    .string()
    .min(16, "Webhook secret must be at least 16 characters for security")
    .max(255, "Webhook secret must not exceed 255 characters")
    .optional()
});

/**
 * Schema for getting webhook configuration by data fiduciary ID.
 */
export const GetWebhookSchema = z.object({
  data_fiduciary_id: z
    .string()
    .uuid("Invalid data fiduciary ID format"),
});

/**
 * Schema for getting webhook logs.
 */
export const GetWebhookLogsSchema = z.object({
  data_fiduciary_id: z
    .string()
    .uuid("Invalid data fiduciary ID format"),
  
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .optional()
    .default(50),
  
  offset: z
    .number()
    .int("Offset must be an integer")
    .min(0, "Offset must be at least 0")
    .optional()
    .default(0),
});

/**
 * Schema for getting data fiduciary profile by ID.
 */
export const GetDataFiduciaryByIdSchema = z.object({
  data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID format"),
});

/**
 * Schema for approving a data fiduciary.
 */
export const ApproveDataFiduciarySchema = z.object({
  data_fiduciary_id: z
    .string()
    .uuid("Invalid data fiduciary ID format"),
  
  approved_by_user_id: z
    .string()
    .uuid("Invalid user ID format"),
  
  approval_notes: z
    .string()
    .max(500, "Approval notes must not exceed 500 characters")
    .optional(),
}).transform(({ data_fiduciary_id, approved_by_user_id, approval_notes }) => ({
  data_fiduciary_id,
  approved_by_user_id,
  approval_notes,
}));

/**
 * Schema for getting all data fiduciaries in review with pagination and filtering.
 * Combines query parameters for search, filter, and pagination.
 */
export const GetAllDataFiduciariesInReviewSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    dpdp_compliant: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    gdpr_compliant: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    sort_by: z.string().optional().default("created_at"),
    sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
  }),
}).transform(({ query }) => ({
  page: query.page,
  limit: query.limit,
  q: query.q,
  dpdp_compliant: query.dpdp_compliant,
  gdpr_compliant: query.gdpr_compliant,
  sort_by: query.sort_by,
  sort_order: query.sort_order,
}));

/**
 * Schema for getting data fiduciary in review analytics.
 * No parameters required - returns overall analytics.
 */
export const GetDataFiduciaryInReviewAnalyticsSchema = z.object({});
