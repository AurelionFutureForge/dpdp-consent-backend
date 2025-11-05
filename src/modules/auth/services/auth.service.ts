/**
 * @fileoverview Authentication service for handling business logic related to user authentication.
 * @module modules/auth/services
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import { AuthTypes } from "@/modules/auth";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, sendOTPEmail } from "@/modules/common/utils";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Handles user login by email authentication.
 * Checks if the email exists in the User table and validates account status.
 * 
 * @param email - User's email address.
 * @param type - Login type (MFA or SSO).
 * 
 * @returns Login response containing user data and tokens, or OTP response for MFA.
 */
export const handleLogin = async (email: string, type: AuthTypes.LoginType): Promise<AuthTypes.LoginResponse | AuthTypes.MFAOTPResponse> => {
  try {
    // Check if email exists in User table
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        name: true,
        role: true,
        data_fiduciary_id: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!user) {
      throw new AppError("Email not found. Please check your email or contact support.", 404);
    }

    // Check if user is active and not deleted
    if (user.is_deleted) {
      throw new AppError("User account has been deleted", 403);
    }

    if (!user.is_active) {
      throw new AppError("User account is inactive", 403);
    }

    // Handle MFA login - Send OTP
    if (type === AuthTypes.LoginType.MFA) {
      const otp = generateOTP();
      const otp_id = uuidv4();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Upsert OTP entry (more efficient than delete + create)
      await prisma.oTP.upsert({
        where: { email: user.email },
        update: {
          otp_id: otp_id,
          otp_code: otp,
          expires_at: expiresAt,
          created_at: new Date(),
        },
        create: {
          otp_id: otp_id,
          user_id: user.user_id,
          email: user.email,
          otp_code: otp,
          expires_at: expiresAt,
        },
      });

      // Send OTP email asynchronously (fire-and-forget for better performance)
      sendOTPEmail(email, otp, user.name)
        .then((emailSent) => {
          if (emailSent) {
            console.log(`✅ OTP email sent to ${email}`);
          } else {
            console.error(`❌ Failed to send OTP email to ${email}`);
          }
        })
        .catch((error) => {
          console.error(`❌ Error sending OTP email to ${email}:`, error);
        });

      // Log OTP in development for easy testing
      if (process.env.NODE_ENV === "development") {
        console.log(`📧 OTP for ${email}: ${otp} (ID: ${otp_id})`);
      }

      return {
        success: true,
        message: "OTP sent successfully to your email",
        data: {
          email: user.email,
          otp_id: otp_id,
          expires_in: 300, // 5 minutes in seconds
        },
      };
    }

    // Handle SSO login - Return tokens directly
    if (type === AuthTypes.LoginType.SSO) {
      // Calculate is_system_admin: true if role is SYSTEM_ADMIN/ADMINISTRATOR/DPO/AUDITOR and data_fiduciary_id is null
      const isSystemAdmin = (user.role === "SYSTEM_ADMIN" || user.role === "ADMINISTRATOR" || user.role === "DPO" || user.role === "AUDITOR") && user.data_fiduciary_id === null;
      
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      };

      const access_token = generateAccessToken(tokenPayload);
      const refresh_token = generateRefreshToken(tokenPayload);

      return {
        success: true,
        message: "Login successful",
        data: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_system_admin: isSystemAdmin,
          data_fiduciary_id: user.data_fiduciary_id,
          token_data: {
            access_token,
            refresh_token,
          },
        },
      };
    }

    throw new AppError("Invalid login type", 400);

  } catch (error) {
    throw error;
  }
};

/**
 * Handles OTP verification for MFA login.
 * Verifies the OTP code and returns user tokens if valid.
 * 
 * @param email - User's email address.
 * @param otp - OTP code to verify.
 * @param otp_id - OTP session identifier.
 * 
 * @returns Login response containing user data and tokens.
 */
export const handleVerifyOTP = async (email: string, otp: string, otp_id: string): Promise<AuthTypes.LoginResponse> => {
  try {
    // Verify OTP from database using Prisma
    const storedOTP = await prisma.oTP.findFirst({
      where: {
        email: email,
        otp_id: otp_id,
      },
    });

    if (!storedOTP) {
      throw new AppError("Invalid OTP session. Please request a new OTP.", 400);
    }

    // Check if OTP is expired
    if (new Date() > storedOTP.expires_at) {
      // Delete expired OTP
      await prisma.oTP.delete({
        where: { otp_id: otp_id },
      });
      throw new AppError("OTP has expired. Please request a new one.", 400);
    }

    // Verify OTP code
    if (storedOTP.otp_code !== otp) {
      throw new AppError("Invalid OTP code. Please try again.", 400);
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { user_id: storedOTP.user_id },
      select: {
        user_id: true,
        email: true,
        name: true,
        role: true,
        data_fiduciary_id: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.is_deleted) {
      throw new AppError("User account has been deleted", 403);
    }

    if (!user.is_active) {
      throw new AppError("User account is inactive", 403);
    }

    // Delete used OTP
    await prisma.oTP.delete({
      where: { otp_id: otp_id },
    });

    // Calculate is_system_admin: true if role is SYSTEM_ADMIN/ADMINISTRATOR/DPO/AUDITOR and data_fiduciary_id is null
    const isSystemAdmin = (user.role === "SYSTEM_ADMIN" || 
                          user.role === "ADMINISTRATOR" || 
                          user.role === "DPO" || 
                          user.role === "AUDITOR") && 
                          user.data_fiduciary_id === null;

    // Generate JWT tokens
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const access_token = generateAccessToken(tokenPayload);
    const refresh_token = generateRefreshToken(tokenPayload);

    return {
      success: true,
      message: "Login successful",
      data: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_system_admin: isSystemAdmin,
        data_fiduciary_id: user.data_fiduciary_id,
        token_data: {
          access_token,
          refresh_token,
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Handles refresh token to generate new access and refresh tokens.
 * Validates the refresh token and generates new tokens.
 * 
 * @param refresh_token - JWT refresh token.
 * 
 * @returns Refresh token response containing new tokens.
 */
export const handleRefreshToken = async (refresh_token: string): Promise<AuthTypes.RefreshTokenResponse> => {
  try {
    // Verify the refresh token
    const decoded = await verifyRefreshToken(refresh_token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        email: true,
        role: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.is_deleted) {
      throw new AppError("User account has been deleted", 403);
    }

    if (!user.is_active) {
      throw new AppError("User account is inactive", 403);
    }

    // Generate new tokens
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const new_access_token = generateAccessToken(tokenPayload);
    const new_refresh_token = generateRefreshToken(tokenPayload);

    return {
      success: true,
      message: "Token refreshed successfully",
      data: {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
      },
    };
  } catch (error) {
    throw error;
  }
};