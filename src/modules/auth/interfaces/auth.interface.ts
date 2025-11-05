/**
 * @fileoverview TypeScript interfaces for authentication module.
 * @module modules/auth/interfaces
 */

/**
 * Interface for login API response.
 * 
 * @interface LoginResponse
 * @property {boolean} success - Indicates if the login was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - User data object or null if login failed.
 * @property {string} data.user_id - Unique identifier for the user.
 * @property {string} data.email - User's email address.
 * @property {string} data.name - User's full name.
 * @property {string} data.role - User's role (e.g., ADMIN, DPO, AUDITOR, SYSTEM_ADMIN).
 * @property {boolean} data.is_system_admin - Indicates if user is a system admin (true if role is SYSTEM_ADMIN/ADMINISTRATOR/DPO/AUDITOR and data_fiduciary_id is null).
 * @property {string|null} data.data_fiduciary_id - Data fiduciary ID associated with the user (null if system admin).
 * @property {Object} data.token_data - Authentication tokens.
 * @property {string} data.token_data.access_token - JWT access token for API authentication.
 * @property {string} data.token_data.refresh_token - JWT refresh token for renewing access token.
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    email: string;
    name: string;
    role: string;
    is_system_admin: boolean;
    data_fiduciary_id: string | null;
    token_data: {
      access_token: string;
      refresh_token: string;
    };
  } | null;
}

/**
 * Login type enumeration
 */
export enum LoginType {
  MFA = "MFA",
  SSO = "SSO"
}

/**
 * Interface for email login request payload.
 * 
 * @interface EmailLoginRequest
 * @property {string} email - User's email address for login.
 * @property {LoginType} type - Login type (MFA or SSO).
 */
export interface EmailLoginRequest {
  email: string;
  type: LoginType;
}

/**
 * Interface for refresh token request payload.
 * 
 * @interface RefreshTokenRequest
 * @property {string} refresh_token - JWT refresh token to generate new access token.
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Interface for refresh token API response.
 * 
 * @interface RefreshTokenResponse
 * @property {boolean} success - Indicates if the token refresh was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Token data object or null if refresh failed.
 * @property {string} data.access_token - New JWT access token for API authentication.
 * @property {string} data.refresh_token - New JWT refresh token for renewing access token.
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
  } | null;
}

/**
 * Interface for MFA OTP response.
 * 
 * @interface MFAOTPResponse
 * @property {boolean} success - Indicates if OTP was sent successfully.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - OTP data object or null if sending failed.
 * @property {string} data.email - User's email address where OTP was sent.
 * @property {string} data.otp_id - Unique identifier for the OTP session.
 * @property {number} data.expires_in - OTP expiry time in seconds.
 */
export interface MFAOTPResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    otp_id: string;
    expires_in: number;
  } | null;
}

/**
 * Interface for verify OTP request payload.
 * 
 * @interface VerifyOTPRequest
 * @property {string} email - User's email address.
 * @property {string} otp - OTP code to verify.
 * @property {string} otp_id - OTP session identifier.
 */
export interface VerifyOTPRequest {
  email: string;
  otp: string;
  otp_id: string;
}