/**
 * @fileoverview Consent module barrel export.
 * Centralizes all consent-related exports for easy imports.
 * 
 * @module modules/consent
 * 
 * @example
 * Import specific exports
 * import { ConsentController, ConsentService, ConsentSchema, ConsentTypes } from "@/modules/consent";
 * 
 * Use controller
 * app.post("/consents/initiate", ConsentController.InitiateConsentController);
 * 
 * Use service
 * const result = await ConsentService.initiateConsent(input);
 * 
 * Use schema for validation
 * const validated = ConsentSchema.InitiateConsentSchema.parse(req.body);
 */

/**
 * Namespace containing all Zod validation schemas for consents.
 * @namespace ConsentSchema
 */
export * as ConsentSchema from "./validators/consent.schema";

/**
 * Namespace containing all consent service functions.
 * @namespace ConsentService
 */
export * as ConsentService from "./services/consent.service";

/**
 * Namespace containing all consent controller functions.
 * @namespace ConsentController
 */
export * as ConsentController from "./controllers/consent.controller";

/**
 * Namespace containing all TypeScript interfaces and types for consents.
 * @namespace ConsentTypes
 */
export * as ConsentTypes from "./interfaces/consent.interface";
