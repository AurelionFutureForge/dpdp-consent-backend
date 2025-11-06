/**
 * @fileoverview Data fiduciary controllers for handling registration and management requests.
 * @module modules/data-fiduciary/controllers
 */

import { NextFunction, Request, Response } from "express";
import { DataFiduciaryService, DataFiduciarySchema } from "@/modules/data-fiduciary";
import { sendResponse } from "@/modules/common/utils";

/**
 * Controller to handle data fiduciary registration.
 * Validates registration data, creates a new data fiduciary entity,
 * and returns API credentials for authentication.
 * 
 * @param req - Express request object containing registration data in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with data fiduciary data and API credentials or passes error to error handler.
 */
export const RegisterDataFiduciaryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = DataFiduciarySchema.RegisterDataFiduciarySchema.parse(req.body);
    const response = await DataFiduciaryService.handleRegisterDataFiduciary(validatedData);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle webhook configuration creation/update.
 * Validates webhook data and updates the data fiduciary's webhook settings.
 * 
 * @param req - Express request object containing webhook configuration in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with webhook configuration or passes error to error handler.
 */
export const CreateWebhookController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = DataFiduciarySchema.CreateWebhookSchema.parse(req.body);
    const response = await DataFiduciaryService.handleCreateWebhook(validatedData);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve webhook configuration for a data fiduciary.
 * 
 * @param req - Express request object containing data_fiduciary_id in params.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with webhook configuration or passes error to error handler.
 */
export const GetWebhookController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_fiduciary_id } = DataFiduciarySchema.GetWebhookSchema.parse(req.params);
    const response = await DataFiduciaryService.handleGetWebhook(data_fiduciary_id);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve webhook logs for a data fiduciary.
 * 
 * @param req - Express request object containing data_fiduciary_id in params and optional pagination in query.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with webhook logs or passes error to error handler.
 */
export const GetWebhookLogsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_fiduciary_id } = DataFiduciarySchema.GetWebhookSchema.parse(req.params);
    
    // Parse pagination parameters from query
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    
    const response = await DataFiduciaryService.handleGetWebhookLogs(data_fiduciary_id, limit, offset);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve complete data fiduciary profile by ID.
 * Used for displaying data fiduciary profile page with all information.
 * 
 * @param req - Express request object containing data_fiduciary_id in params.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with complete data fiduciary profile or passes error to error handler.
 */
export const GetDataFiduciaryByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data_fiduciary_id } = DataFiduciarySchema.GetDataFiduciaryByIdSchema.parse(req.params);
    const response = await DataFiduciaryService.handleGetDataFiduciaryById(data_fiduciary_id);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to approve a data fiduciary registration.
 * Activates the data fiduciary account and approves associated platform submissions.
 * 
 * @param req - Express request object containing approval data in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with approval result or passes error to error handler.
 */
export const ApproveDataFiduciaryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = DataFiduciarySchema.ApproveDataFiduciarySchema.parse(req.body);
    const response = await DataFiduciaryService.handleApproveDataFiduciary(validatedData);
    sendResponse(res, response.status, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve all data fiduciaries in review with pagination, search, and filtering.
 * 
 * @param req - Express request object with query parameters for pagination, search, and filtering.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with paginated list of data fiduciaries in review or passes error to error handler.
 */
export const GetAllDataFiduciariesInReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, q, dpdp_compliant, gdpr_compliant, sort_by, sort_order } = DataFiduciarySchema.GetAllDataFiduciariesInReviewSchema.parse({ query: req.query });
    const response = await DataFiduciaryService.getAllDataFiduciariesInReview(page, limit, q, dpdp_compliant, gdpr_compliant, sort_by, sort_order);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve analytics for data fiduciaries in review.
 * 
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with analytics data or passes error to error handler.
 */
export const GetDataFiduciaryInReviewAnalyticsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await DataFiduciaryService.getDataFiduciaryInReviewAnalytics();
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};