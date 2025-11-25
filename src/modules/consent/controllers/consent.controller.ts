/**
 * @fileoverview Consent Collection controllers for handling API requests.
 * @module modules/consent/controllers
 */

import { NextFunction, Request, Response } from "express";
import * as ConsentService from "@/modules/consent/services/consent.service";
import * as ConsentSchema from "@/modules/consent/validators/consent.schema";
import { sendResponse } from "@/modules/common/utils";

/**
 * Controller to initiate consent request (Step 1 in diagram)
 * POST /api/v1/consents/initiate
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const InitiateConsentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = ConsentSchema.InitiateConsentSchema.parse({ body: req.body });
    const response = await ConsentService.initiateConsent(input);
    sendResponse(res, 201, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get consent notice (Step 5-7 in diagram)
 * GET /consents/:cms_request_id
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const GetConsentNoticeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cms_request_id, language } = ConsentSchema.GetConsentNoticeSchema.parse({
      params: req.params,
      query: req.query,
    });
    const response = await ConsentService.getConsentNotice(cms_request_id, language);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    console.log(error)
    next(error);
  }
};

/**
 * Controller to submit consent (Step 8-11 in diagram)
 * POST /api/v1/consents/submit
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const SubmitConsentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = ConsentSchema.SubmitConsentSchema.parse({ body: req.body });
    const response = await ConsentService.submitConsent(input);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to validate consent (Step 16-18 in diagram)
 * GET /api/v1/consents/validate
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const ValidateConsentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = ConsentSchema.ValidateConsentSchema.parse({ query: req.query });
    const response = await ConsentService.validateConsent(input);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    console.error("Error in ValidateConsentController:", error);
    next(error);
  }
};

/**
 * Controller to get consent artifact by ID
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const GetConsentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { artifact_id, data_fiduciary_id } = ConsentSchema.GetConsentByIdSchema.parse({
      params: req.params,
    });
    const response = await ConsentService.getConsentById(artifact_id, data_fiduciary_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list consents with filters and pagination
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const ListConsentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = ConsentSchema.ListConsentsSchema.parse({
      params: req.params,
      query: req.query,
    });
    const response = await ConsentService.listConsents(filters);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to withdraw consent
 * POST /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/withdraw
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const WithdrawConsentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = ConsentSchema.WithdrawConsentSchema.parse({
      params: req.params,
      body: req.body,
    });
    const response = await ConsentService.withdrawConsent(input);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get consent history
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/history
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const GetConsentHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { artifact_id, data_fiduciary_id, page, limit } = ConsentSchema.GetConsentHistorySchema.parse({
      params: req.params,
      query: req.query,
    });
    const response = await ConsentService.getConsentHistory(artifact_id, data_fiduciary_id, page, limit);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get user consents by external user ID
 * GET /api/v1/data-fiduciaries/:data_fiduciary_id/users/:external_user_id/consents
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const GetUserConsentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = ConsentSchema.GetUserConsentsSchema.parse({ params: req.params, query: req.query });
    const response = await ConsentService.listConsents({ data_fiduciary_id: params.data_fiduciary_id, external_user_id: params.external_user_id, status: params.status, page: params.page, limit: params.limit });
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to validate bulk consents
 * POST /api/v1/consents/validate-bulk
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * 
 * @returns {Promise<void>} Sends JSON response
 */
export const ValidateBulkConsentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data_fiduciary_id, validations } = ConsentSchema.ValidateBulkConsentsSchema.parse({
      body: req.body,
    });

    const results = await Promise.all(
      validations.map(async (validation) => {
        try {
          const response = await ConsentService.validateConsent({
            artifact_id: validation.artifact_id,
            data_fiduciary_id,
            purpose_id: validation.purpose_id,
          });
          return response.data;
        } catch (error: any) {
          return {
            artifact_id: validation.artifact_id,
            is_valid: false,
            status: "ERROR" as const,
            message: error.message || "Validation failed",
          };
        }
      })
    );

    sendResponse(res, 200, true, "Bulk validation completed", { results });
  } catch (error) {
    next(error);
  }
};
