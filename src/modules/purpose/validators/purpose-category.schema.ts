/**
 * @fileoverview Zod validation schemas for Purpose Category operations.
 * @module modules/purpose/validators
 */

import { z } from "zod";

/**
 * Combined schema for getting all purpose categories (params + query).
 */
export const GetAllPurposeCategoriesSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  query: z.object({
    q: z.string().optional(),
    is_active: z
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
  is_active: query.is_active,
  sort_by: query.sort_by,
  sort_order: query.sort_order,
}));

/**
 * Combined schema for getting purpose category by ID (params).
 */
export const GetPurposeCategoryByIdSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_category_id: z.string().uuid("Invalid purpose category ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_category_id: params.purpose_category_id,
}));

/**
 * Combined schema for creating a purpose category (params + body).
 */
export const CreatePurposeCategorySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(100, "Name cannot exceed 100 characters"),
    description: z.string().optional(),
    display_order: z.number().int().min(0).optional().default(0),
  }),
}).transform(({ params, body }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  name: body.name,
  description: body.description,
  display_order: body.display_order,
}));

/**
 * Combined schema for updating a purpose category (params + body).
 */
export const UpdatePurposeCategorySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_category_id: z.string().uuid("Invalid purpose category ID"),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, "Name must be at least 3 characters long")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    description: z.string().optional().nullable(),
    display_order: z.number().int().min(0).optional(),
  }),
}).transform(({ params, body }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_category_id: params.purpose_category_id,
  name: body.name,
  description: body.description,
  display_order: body.display_order,
}));

/**
 * Combined schema for toggling purpose category status (params).
 */
export const TogglePurposeCategoryStatusSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_category_id: z.string().uuid("Invalid purpose category ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_category_id: params.purpose_category_id,
}));

/**
 * Combined schema for deleting a purpose category (params).
 */
export const DeletePurposeCategorySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
    purpose_category_id: z.string().uuid("Invalid purpose category ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  purpose_category_id: params.purpose_category_id,
}));

/**
 * Combined schema for getting purpose category analytics (params).
 */
export const GetPurposeCategoryAnalyticsSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
}));

/**
 * Combined schema for getting purpose category mini summary (params).
 */
export const GetPurposeCategoryMiniSummarySchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
}).transform(({ params }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
}));

/**
 * Combined schema for reordering purpose categories (params + body).
 */
export const ReorderPurposeCategoriesSchema = z.object({
  params: z.object({
    data_fiduciary_id: z.string().uuid("Invalid data fiduciary ID"),
  }),
  body: z.object({
    categories: z.array(
      z.object({
        purpose_category_id: z.string().uuid("Invalid purpose category ID"),
        display_order: z.number().int().min(0),
      })
    ),
  }),
}).transform(({ params, body }) => ({
  data_fiduciary_id: params.data_fiduciary_id,
  categories: body.categories,
}));

/**
 * Schema for getting purpose categories grouped by data fiduciary (query).
 */
export const GetPurposeCategoriesGroupedByFiduciarySchema = z.object({
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
