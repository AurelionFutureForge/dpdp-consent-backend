/**
 * @fileoverview Data fiduciary module barrel export.
 * Centralizes all data-fiduciary-related exports for easy imports.
 * 
 * @module modules/data-fiduciary
 * 
 * @example
 * Import specific exports
 * import { DataFiduciaryController, DataFiduciaryService, DataFiduciarySchema, DataFiduciaryTypes } from "@/modules/data-fiduciary";
 * 
 * Use controller
 * app.post("/register", DataFiduciaryController.RegisterDataFiduciaryController);
 * 
 * Use service
 * const result = await DataFiduciaryService.handleRegisterDataFiduciary(data);
 * 
 * Use schema for validation
 * const validated = DataFiduciarySchema.RegisterDataFiduciarySchema.parse(req.body);
 */

/**
 * Namespace containing all Zod validation schemas for data fiduciary.
 * @namespace DataFiduciarySchema
 */
export * as DataFiduciarySchema from "./validators/data-fiduciary.schema";

/**
 * Namespace containing all data fiduciary service functions.
 * @namespace DataFiduciaryService
 */
export * as DataFiduciaryService from "./services/data-fiduciary.service";

/**
 * Namespace containing all data fiduciary controller functions.
 * @namespace DataFiduciaryController
 */
export * as DataFiduciaryController from "./controllers/data-fiduciary.controller";

/**
 * Namespace containing all TypeScript interfaces and types for data fiduciary.
 * @namespace DataFiduciaryTypes
 */
export * as DataFiduciaryTypes from "./interfaces/data-fiduciary.interface";