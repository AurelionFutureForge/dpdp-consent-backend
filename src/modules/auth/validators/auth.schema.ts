import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  type: z
    .enum(["MFA", "SSO"], {
      errorMap: () => ({ message: "Type must be either MFA or SSO" })
    }),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z
    .string()
    .min(1, "Refresh token is required"),
});

export const VerifyOTPSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(1, "Email is required"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  otp_id: z
    .string()
    .min(1, "OTP ID is required"),
});