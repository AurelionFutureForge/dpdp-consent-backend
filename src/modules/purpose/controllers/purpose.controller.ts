/**
 * @fileoverview Purpose controllers for handling API requests.
 * @module modules/purpose/controllers
 */

import { NextFunction, Request, Response } from "express";
import * as PurposeService from "@/modules/purpose/services/purpose.service";
import * as PurposeSchema from "@/modules/purpose/validators/purpose.schema";
import { sendResponse } from "@/modules/common/utils";

/**
 * Controller to retrieve all ACTIVE purposes (no pagination).
 * Used for consent flow - returns only active purposes with current versions.
 * 
 * Validates that all returned purposes have current versions.
 * Purposes without current versions are excluded and logged as warnings.
 * 
 * @param {Request} req - Express request object with data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with active purposes data (only purposes with current versions).
 */
export const GetActivePurposesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id } = PurposeSchema.GetActivePurposesSchema.parse({ params: req.params });
    const response = await PurposeService.getActivePurposes(data_fiduciary_id);
    
    // ✅ Validate that all returned purposes have current versions
    const purposesWithoutVersions = response.data.filter(
      (purpose: any) => !purpose.current_version || purpose.current_version === null
    );

    if (purposesWithoutVersions.length > 0) {
      // This should not happen as service filters them out, but double-check for safety
      const purposeIds = purposesWithoutVersions.map((p: any) => p.purpose_id).join(', ');
      console.warn(
        `[PURPOSE-CONTROLLER] Warning: ${purposesWithoutVersions.length} purpose(s) without current versions detected: ${purposeIds}`
      );
      
      // Filter them out from response
      response.data = response.data.filter(
        (purpose: any) => purpose.current_version && purpose.current_version !== null
      );
      
      response.message = `${response.message} (${purposesWithoutVersions.length} filtered out - no current version)`;
    }

    // ✅ Final validation: Ensure all purposes in response have current_version
    const allHaveVersions = response.data.every(
      (purpose: any) => purpose.current_version && purpose.current_version.purpose_version_id
    );

    if (!allHaveVersions) {
      // This is a critical error - should not happen
      console.error(
        '[PURPOSE-CONTROLLER] Critical: Some purposes in response still lack current_version. This should not occur.'
      );
    }

    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve all purposes with pagination, search, and filtering.
 * 
 * @param {Request} req - Express request object with query parameters and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with purposes data.
 */
export const GetAllPurposesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, page, limit, q, purpose_category_id, is_active, is_mandatory, requires_renewal, sort_by, sort_order } = PurposeSchema.GetAllPurposesSchema.parse({ params: req.params, query: req.query });
    const response = await PurposeService.getAllPurposes(data_fiduciary_id, page, limit, q, purpose_category_id, is_active, is_mandatory, requires_renewal, sort_by, sort_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve a specific purpose by ID.
 * 
 * @param {Request} req - Express request object with purpose_id and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with purpose data.
 */
export const GetPurposeByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_id } = PurposeSchema.GetPurposeByIdSchema.parse({ params: req.params });
    const response = await PurposeService.getPurposeById(purpose_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create a new purpose.
 * 
 * @param {Request} req - Express request object with purpose data in body and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with created purpose data.
 */
export const CreatePurposeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_category_id, title, description, legal_basis, data_fields, processing_activities, retention_period_days, is_mandatory, is_active, requires_renewal, renewal_period_days, display_order } = PurposeSchema.CreatePurposeSchema.parse({ params: req.params, body: req.body });
    const response = await PurposeService.createPurpose(data_fiduciary_id, purpose_category_id, title, description, legal_basis, data_fields, processing_activities, retention_period_days, is_mandatory, is_active, requires_renewal, renewal_period_days, display_order);
    sendResponse(res, 201, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a purpose.
 * 
 * @param {Request} req - Express request object with purpose ID and data_fiduciary_id in params and update data in body.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with updated purpose data.
 */
export const UpdatePurposeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_id, purpose_category_id, title, description, legal_basis, data_fields, processing_activities, retention_period_days, is_mandatory, is_active, requires_renewal, renewal_period_days, display_order } = PurposeSchema.UpdatePurposeSchema.parse({ params: req.params, body: req.body });
    const response = await PurposeService.updatePurpose(purpose_id, data_fiduciary_id, purpose_category_id, title, description, legal_basis, data_fields, processing_activities, retention_period_days, is_mandatory, is_active, requires_renewal, renewal_period_days, display_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to toggle the active status of a purpose.
 * 
 * @param {Request} req - Express request object with purpose ID and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with updated purpose data.
 */
export const TogglePurposeStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_id } = PurposeSchema.TogglePurposeStatusSchema.parse({ params: req.params });
    const response = await PurposeService.togglePurposeStatus(purpose_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a purpose.
 * 
 * @param {Request} req - Express request object with purpose ID and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with deletion confirmation.
 */
export const DeletePurposeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_id } = PurposeSchema.DeletePurposeSchema.parse({ params: req.params });
    const response = await PurposeService.deletePurpose(purpose_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get purpose analytics summary (detailed).
 * 
 * @param {Request} req - Express request object with data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with detailed analytics data.
 */
export const GetPurposeAnalyticsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id } = PurposeSchema.GetPurposeAnalyticsSchema.parse({ params: req.params });
    const response = await PurposeService.getPurposeAnalytics(data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get purposes grouped by category for a specific fiduciary.
 * 
 * @param {Request} req - Express request object with data_fiduciary_id in params and query parameters (page, limit, q).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with grouped purposes by category.
 */
export const GetPurposesGroupedByCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, page, limit, q } = PurposeSchema.GetPurposesGroupedByCategorySchema.parse({ params: req.params, query: req.query });
    const response = await PurposeService.getPurposesGroupedByCategory(data_fiduciary_id, page, limit, q);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get analytics for purposes grouped by data fiduciary.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with grouped purposes analytics.
 */
export const GetGroupedPurposesAnalyticsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const response = await PurposeService.getGroupedPurposesAnalytics();
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get purposes grouped by data fiduciary.
 * 
 * @param {Request} req - Express request object with query parameters (page, limit, q).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with grouped purposes by fiduciary.
 */
export const GetPurposesGroupedByFiduciaryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, q } = PurposeSchema.GetPurposesGroupedByFiduciarySchema.parse({ query: req.query });
    const response = await PurposeService.getPurposesGroupedByFiduciary(page, limit, q);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get complete version history of a purpose.
 * 
 * @param {Request} req - Express request object with purpose_id and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with purpose version history.
 */
export const GetPurposeHistoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_id } = PurposeSchema.GetPurposeHistorySchema.parse({ params: req.params });
    const response = await PurposeService.getPurposeHistory(purpose_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};