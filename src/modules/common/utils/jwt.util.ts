require("dotenv").config();
import { env } from "@config/env/env";
import jwt from "jsonwebtoken";

/**
 * Payload interface for JWT tokens
 */
interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
}

/**
 * Generate access token
 * @param payload - User data to encode in token
 * @returns JWT access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

/**
 * Generate refresh token
 * @param payload - User data to encode in token
 * @returns JWT refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

/**
 * Verify refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 */
export const verifyRefreshToken = async (token: string): Promise<JWTPayload> => {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    throw error;
  }
};