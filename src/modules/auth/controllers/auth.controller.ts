/**
 * @fileoverview Authentication controllers for handling login requests.
 * @module modules/auth/controllers
 */

import { NextFunction, Request, Response } from "express";
import { AuthService, AuthSchema, AuthTypes } from "@/modules/auth";
import { sendResponse } from "@/modules/common/utils";

/**
 * Controller to handle user login via email.
 * Validates email and type, checks if user exists in the User table.
 * - If type is MFA: Sends OTP to email
 * - If type is SSO: Returns user data with tokens
 * 
 * @param req - Express request object containing email and type in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with user data/OTP info or passes error to error handler.
 */
export const LoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, type } = AuthSchema.LoginSchema.parse(req.body);
    const response = await AuthService.handleLogin(email, type as AuthTypes.LoginType);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle OTP verification for MFA login.
 * Validates OTP code and returns user data with tokens if valid.
 * 
 * @param req - Express request object containing email, otp, and otp_id in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with user data and tokens or passes error to error handler.
 */
export const VerifyOTPController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, otp_id } = AuthSchema.VerifyOTPSchema.parse(req.body);
    const response = await AuthService.handleVerifyOTP(email, otp, otp_id);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle refresh token requests.
 * Validates refresh token and generates new access and refresh tokens.
 * 
 * @param req - Express request object containing refresh_token in body.
 * @param res - Express response object.
 * @param next - Express next middleware function for error handling.
 * 
 * @returns Sends JSON response with new tokens or passes error to error handler.
 */
export const RefreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = AuthSchema.RefreshTokenSchema.parse(req.body);
    const response = await AuthService.handleRefreshToken(refresh_token);
    sendResponse(res, 200, response.success, response.message, response.data);
  } catch (error) {
    next(error);
  }
};