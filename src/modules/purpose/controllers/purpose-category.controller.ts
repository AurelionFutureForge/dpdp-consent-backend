/**
 * @fileoverview Purpose Category controllers for handling API requests.
 * @module modules/purpose/controllers
 */

import { NextFunction, Request, Response } from "express";
import * as PurposeCategoryService from "@/modules/purpose/services/purpose-category.service";
import * as PurposeCategorySchema from "@/modules/purpose/validators/purpose-category.schema";
import { sendResponse } from "@/modules/common/utils";

/**
 * Controller to retrieve all purpose categories with pagination, search, and filtering.
 * 
 * @param {Request} req - Express request object with query parameters and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with purpose categories data.
 */
export const GetAllPurposeCategoriesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, page, limit, q, is_active, sort_by, sort_order } = PurposeCategorySchema.GetAllPurposeCategoriesSchema.parse({ params: req.params, query: req.query });
    const response = await PurposeCategoryService.getAllPurposeCategories(data_fiduciary_id, page, limit, q, is_active, sort_by, sort_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve a specific purpose category by ID.
 * 
 * @param {Request} req - Express request object with purpose_category_id and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with purpose category data.
 */
export const GetPurposeCategoryByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_category_id } = PurposeCategorySchema.GetPurposeCategoryByIdSchema.parse({ params: req.params });
    const response = await PurposeCategoryService.getPurposeCategoryById(purpose_category_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create a new purpose category.
 * 
 * @param {Request} req - Express request object with category data in body and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with created category data.
 */
export const CreatePurposeCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, name, description, display_order } = PurposeCategorySchema.CreatePurposeCategorySchema.parse({ params: req.params, body: req.body });
    const response = await PurposeCategoryService.createPurposeCategory(data_fiduciary_id, name, description, display_order);
    sendResponse(res, 201, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a purpose category.
 * 
 * @param {Request} req - Express request object with category ID and data_fiduciary_id in params and update data in body.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with updated category data.
 */
export const UpdatePurposeCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_category_id, name, description, display_order } = PurposeCategorySchema.UpdatePurposeCategorySchema.parse({ params: req.params, body: req.body });
    const response = await PurposeCategoryService.updatePurposeCategory(purpose_category_id, data_fiduciary_id,  name, description, display_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to toggle the active status of a purpose category.
 * 
 * @param {Request} req - Express request object with category ID and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with updated category data.
 */
export const TogglePurposeCategoryStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_category_id } = PurposeCategorySchema.TogglePurposeCategoryStatusSchema.parse({ params: req.params });
    const response = await PurposeCategoryService.togglePurposeCategoryStatus(purpose_category_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a purpose category.
 * 
 * @param {Request} req - Express request object with category ID and data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with deletion confirmation.
 */
export const DeletePurposeCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id, purpose_category_id } = PurposeCategorySchema.DeletePurposeCategorySchema.parse({ params: req.params });
    const response = await PurposeCategoryService.deletePurposeCategory(purpose_category_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get purpose category analytics summary (detailed).
 * 
 * @param {Request} req - Express request object with data_fiduciary_id in params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with detailed analytics data.
 */
export const GetPurposeCategoryAnalyticsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data_fiduciary_id } = PurposeCategorySchema.GetPurposeCategoryAnalyticsSchema.parse({ params: req.params });
    const response = await PurposeCategoryService.getPurposeCategoryAnalytics(data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get analytics for purpose categories grouped by data fiduciary.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with grouped categories analytics.
 */
export const GetGroupedCategoriesAnalyticsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const response = await PurposeCategoryService.getGroupedCategoriesAnalytics();
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get purpose categories grouped by data fiduciary.
 * 
 * @param {Request} req - Express request object with query parameters (page, limit, q).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {Promise<void>} Sends JSON response with grouped categories by fiduciary.
 */
export const GetPurposeCategoriesGroupedByFiduciaryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, q } = PurposeCategorySchema.GetPurposeCategoriesGroupedByFiduciarySchema.parse({ query: req.query });
    const response = await PurposeCategoryService.getPurposeCategoriesGroupedByFiduciary(page, limit, q);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve all purposes for a specific purpose category with pagination, search, and filtering.
 * 
 * @param req - Express request object with data_fiduciary_id and purpose_category_id in params and query parameters.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with paginated list of purposes or passes error to error handler.
 */
export const GetAllPurposesByCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_fiduciary_id, purpose_category_id, page, limit, q, is_active, is_mandatory, requires_renewal, sort_by, sort_order } = PurposeCategorySchema.GetAllPurposesByCategorySchema.parse({ params: req.params, query: req.query });
    const response = await PurposeCategoryService.getAllPurposesByCategory(data_fiduciary_id, purpose_category_id, page, limit, q, is_active, is_mandatory, requires_renewal, sort_by, sort_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve analytics for purposes in a specific category.
 * 
 * @param req - Express request object with data_fiduciary_id and purpose_category_id in params.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with analytics data or passes error to error handler.
 */
export const GetPurposesCategoryAnalyticsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_fiduciary_id, purpose_category_id } = PurposeCategorySchema.GetPurposesCategoryAnalyticsSchema.parse({ params: req.params });
    const response = await PurposeCategoryService.getPurposesCategoryAnalytics(data_fiduciary_id, purpose_category_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};