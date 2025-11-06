/**
 * @fileoverview Purpose module barrel export.
 * Centralizes all purpose-related exports for easy imports.
 * 
 * @module modules/purpose
 * 
 * @example
 * Import specific exports
 * import { PurposeCategoryController, PurposeCategoryService, PurposeCategorySchema, PurposeCategoryTypes } from "@/modules/purpose";
 * 
 * Use controller
 * app.get("/purpose-categories", PurposeCategoryController.GetAllPurposeCategoriesController);
 * 
 * Use service
 * const result = await PurposeCategoryService.getAllPurposeCategories(1, 10);
 * 
 * Use schema for validation
 * const validated = PurposeCategorySchema.CreatePurposeCategorySchema.parse(req.body);
 */

/**
 * Namespace containing all Zod validation schemas for purpose categories.
 * @namespace PurposeCategorySchema
 */
export * as PurposeCategorySchema from "./validators/purpose-category.schema";

/**
 * Namespace containing all purpose category service functions.
 * @namespace PurposeCategoryService
 */
export * as PurposeCategoryService from "./services/purpose-category.service";

/**
 * Namespace containing all purpose category controller functions.
 * @namespace PurposeCategoryController
 */
export * as PurposeCategoryController from "./controllers/purpose-category.controller";

/**
 * Namespace containing all TypeScript interfaces and types for purpose categories.
 * @namespace PurposeCategoryTypes
 */
export * as PurposeCategoryTypes from "./interfaces/purpose-category.interface";

/**
 * Namespace containing all Zod validation schemas for purposes.
 * @namespace PurposeSchema
 */
export * as PurposeSchema from "./validators/purpose.schema";

/**
 * Namespace containing all purpose service functions.
 * @namespace PurposeService
 */
export * as PurposeService from "./services/purpose.service";

/**
 * Namespace containing all purpose controller functions.
 * @namespace PurposeController
 */
export * as PurposeController from "./controllers/purpose.controller";

/**
 * Namespace containing all TypeScript interfaces and types for purposes.
 * @namespace PurposeTypes
 */
export * as PurposeTypes from "./interfaces/purpose.interface";

