/**
 * @fileoverview Zod validation schemas for Purpose operations.
 * @module modules/purpose/validators
 */

import { z } from "zod";

/**
 * Combined schema for getting all purposes (params + query).
 */
export const GetAllPurposesSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  query: z.object({
    q: z.string().optional(),
    purpose_category_id: z.string().uuid("Invalid purpose category ID").optional(),
    is_active: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    is_mandatory: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    requires_renewal: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    sort_by: z.string().optional().default("display_order"),
    sort_order: z.enum(["asc", "desc"]).optional().default("asc"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
  }),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  page: query.page,
  limit: query.limit,
  q: query.q,
  purpose_category_id: query.purpose_category_id,
  is_active: query.is_active,
  is_mandatory: query.is_mandatory,
  requires_renewal: query.requires_renewal,
  sort_by: query.sort_by,
  sort_order: query.sort_order,
}));

/**
 * Combined schema for getting purpose by ID (params).
 */
export const GetPurposeByIdSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_id: z.string().uuid("Invalid purpose ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_id: params.purpose_id,
}));

/**
 * Combined schema for creating a purpose (params + body).
 */
export const CreatePurposeSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  body: z.object({
    purpose_category_id: z.string().uuid("Invalid purpose category ID").optional(),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(200, "Title cannot exceed 200 characters"),
    description: z.string().optional(),
    legal_basis: z.string().optional(),
    data_fields: z
      .array(z.string())
      .min(1, "At least one data field is required")
      .max(50, "Cannot exceed 50 data fields"),
    processing_activities: z
      .array(z.string())
      .min(1, "At least one processing activity is required")
      .max(50, "Cannot exceed 50 processing activities"),
    retention_period_days: z
      .number()
      .int()
      .min(1, "Retention period must be at least 1 day")
      .max(36500, "Retention period cannot exceed 100 years")
      .optional(),
    is_mandatory: z.boolean().optional().default(false),
    is_active: z.boolean().optional().default(true),
    requires_renewal: z.boolean().optional().default(false),
    renewal_period_days: z
      .number()
      .int()
      .min(1, "Renewal period must be at least 1 day")
      .max(3650, "Renewal period cannot exceed 10 years")
      .optional(),
    display_order: z.number().int().min(0).optional().default(0),
  }),
}).transform(({ params, body }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_category_id: body.purpose_category_id,
  title: body.title,
  description: body.description,
  legal_basis: body.legal_basis,
  data_fields: body.data_fields,
  processing_activities: body.processing_activities,
  retention_period_days: body.retention_period_days,
  is_mandatory: body.is_mandatory,
  is_active: body.is_active,
  requires_renewal: body.requires_renewal,
  renewal_period_days: body.renewal_period_days,
  display_order: body.display_order,
}));

/**
 * Combined schema for updating a purpose (params + body).
 */
export const UpdatePurposeSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_id: z.string().uuid("Invalid purpose ID"),
  }),
  body: z.object({
    purpose_category_id: z.string().uuid("Invalid purpose category ID").optional().nullable(),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    description: z.string().optional().nullable(),
    legal_basis: z.string().optional().nullable(),
    data_fields: z
      .array(z.string())
      .min(1, "At least one data field is required")
      .max(50, "Cannot exceed 50 data fields")
      .optional(),
    processing_activities: z
      .array(z.string())
      .min(1, "At least one processing activity is required")
      .max(50, "Cannot exceed 50 processing activities")
      .optional(),
    retention_period_days: z
      .number()
      .int()
      .min(1, "Retention period must be at least 1 day")
      .max(36500, "Retention period cannot exceed 100 years")
      .optional()
      .nullable(),
    is_mandatory: z.boolean().optional(),
    is_active: z.boolean().optional(),
    requires_renewal: z.boolean().optional(),
    renewal_period_days: z
      .number()
      .int()
      .min(1, "Renewal period must be at least 1 day")
      .max(3650, "Renewal period cannot exceed 10 years")
      .optional()
      .nullable(),
    display_order: z.number().int().min(0).optional(),
  }),
}).transform(({ params, body }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_id: params.purpose_id,
  purpose_category_id: body.purpose_category_id,
  title: body.title,
  description: body.description,
  legal_basis: body.legal_basis,
  data_fields: body.data_fields,
  processing_activities: body.processing_activities,
  retention_period_days: body.retention_period_days,
  is_mandatory: body.is_mandatory,
  is_active: body.is_active,
  requires_renewal: body.requires_renewal,
  renewal_period_days: body.renewal_period_days,
  display_order: body.display_order,
}));

/**
 * Combined schema for toggling purpose status (params).
 */
export const TogglePurposeStatusSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_id: z.string().uuid("Invalid purpose ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_id: params.purpose_id,
}));

/**
 * Combined schema for deleting a purpose (params).
 */
export const DeletePurposeSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_id: z.string().uuid("Invalid purpose ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_id: params.purpose_id,
}));

/**
 * Combined schema for getting purpose analytics (params).
 */
export const GetPurposeAnalyticsSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
}));

/**
 * Schema for getting purposes grouped by category (params + query).
 */
export const GetPurposesGroupedByCategorySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  query: z.object({
    q: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
  }),
}).transform(({ params, query }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  page: query.page,
  limit: query.limit,
  q: query.q,
}));

/**
 * Schema for getting purposes grouped by data fiduciary (query).
 */
export const GetPurposesGroupedByFiduciarySchema = z.object({
  query: z.object({
    q: z.string().optional(),
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
}));

