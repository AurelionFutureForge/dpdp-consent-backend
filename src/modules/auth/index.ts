/**
 * @fileoverview Authentication module barrel export.
 * Centralizes all authentication-related exports for easy imports.
 * 
 * @module modules/auth
 * 
 * @example
 * Import specific exports
 * import { AuthController, AuthService, AuthSchema, AuthTypes } from "@/modules/auth";
 * 
 * Use controller
 * app.post("/login", AuthController.LoginController);
 * 
 * Use service
 * const result = await AuthService.handleLogin("user@example.com");
 * 
 * Use schema for validation
 * const validated = AuthSchema.LoginSchema.parse(req.body);
 */

/**
 * Namespace containing all Zod validation schemas for authentication.
 * @namespace AuthSchema
 */
export * as AuthSchema from "./validators/auth.schema";

/**
 * Namespace containing all authentication service functions.
 * @namespace AuthService
 */
export * as AuthService from "./services/auth.service";

/**
 * Namespace containing all authentication controller functions.
 * @namespace AuthController
 */
export * as AuthController from "./controllers/auth.controller";

/**
 * Namespace containing all TypeScript interfaces and types for authentication.
 * @namespace AuthTypes
 */
export * as AuthTypes from "./interfaces/auth.interface";