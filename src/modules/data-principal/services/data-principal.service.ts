/**
 * @fileoverview Data Principal Service - User Registration & Management
 * @module modules/data-principal/services
 * 
 * @description
 * Handles registration and management of Data Principals (users).
 * This is where we collect email/phone for notifications.
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import logger from "@/modules/common/utils/logger";
import crypto from "crypto";

/**
 * Register Data Principal Input
 */
export interface RegisterDataPrincipalInput {
  data_fiduciary_id: string;
  external_user_id: string; // User ID from DF's system
  email?: string; // ✅ Collected here
  phone?: string; // ✅ Collected here
  name?: string;
  language?: string;
  metadata?: Record<string, any>;
}

/**
 * Register Data Principal Response
 */
export interface RegisterDataPrincipalResponse {
  data_principal_id: string;
  external_id: string;
  email?: string;
  phone?: string;
  language: string;
  created_at: Date;
}

/**
 * Register a new Data Principal
 * 
 * WHEN TO CALL:
 * - When user registers on Data Fiduciary's platform
 * - When user first uses a service requiring consent
 * - When user creates an account
 * 
 * @param input - Registration data (includes email/phone)
 * @returns Data Principal record
 * 
 * @example
 * // Called by Data Fiduciary when user signs up
 * const principal = await registerDataPrincipal({
 *   data_fiduciary_id: "df-uuid-123",
 *   external_user_id: "user-456",  // DF's internal user ID
 *   email: "user@example.com",      // ✅ Collected during signup
 *   phone: "+1234567890",            // ✅ Collected during signup
 *   name: "John Doe",
 *   language: "en"
 * });
 */
export const registerDataPrincipal = async (
  input: RegisterDataPrincipalInput
): Promise<RegisterDataPrincipalResponse> => {
  try {
    logger.info(`[DATA-PRINCIPAL] Registering user: ${input.external_user_id}`);

    // Validate Data Fiduciary exists
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id: input.data_fiduciary_id },
    });

    if (!fiduciary) {
      throw new AppError("Data Fiduciary not found", 404);
    }

    // Check if user already exists
    let principal = await prisma.dataPrincipal.findUnique({
      where: { external_id: input.external_user_id },
    });

    if (principal) {
      // Update existing user (if email/phone changed)
      principal = await prisma.dataPrincipal.update({
        where: { data_principal_id: principal.data_principal_id },
        data: {
          email: input.email || principal.email,
          phone: input.phone || principal.phone,
          language: input.language || principal.language,
          updated_at: new Date(),
        },
      });

      logger.info(`[DATA-PRINCIPAL] Updated existing user: ${principal.data_principal_id}`);
    } else {
      // Create new Data Principal
      principal = await prisma.dataPrincipal.create({
        data: {
          external_id: input.external_user_id,
          email: input.email,  // ✅ Email stored here
          phone: input.phone,  // ✅ Phone stored here
          language: input.language || "en",
        },
      });

      logger.info(`[DATA-PRINCIPAL] Created new user: ${principal.data_principal_id}`);
    }

    // Create/update principal-fiduciary mapping
    const mapping = await prisma.principalFiduciaryMap.upsert({
      where: {
        data_fiduciary_id_external_ref: {
          data_fiduciary_id: input.data_fiduciary_id,
          external_ref: input.external_user_id,
        },
      },
      update: {
        updated_at: new Date(),
      },
      create: {
        data_fiduciary_id: input.data_fiduciary_id,
        principal_id: principal.data_principal_id,
        external_ref: input.external_user_id,
      },
    });

    // Create audit log (PII-FREE)
    await prisma.auditLog.create({
      data: {
        user_id: principal.data_principal_id,
        action: "CREATE",
        consent_status: null,
        initiator: "FIDUCIARY",
        audit_hash: generateAuditHash({
          action: "REGISTER_PRINCIPAL",
          principal_id: principal.data_principal_id,
          timestamp: new Date(),
        }),
        details: {
          external_user_id: input.external_user_id,
          fiduciary_id: input.data_fiduciary_id,
          // ❌ NO email or phone in audit log
        },
      },
    });

    return {
      data_principal_id: principal.data_principal_id,
      external_id: principal.external_id!,
      email: principal.email || undefined,
      phone: principal.phone || undefined,
      language: principal.language,
      created_at: principal.created_at,
    };
  } catch (error) {
    logger.error("[DATA-PRINCIPAL] Error registering user:", error);
    throw error;
  }
};

/**
 * Update Data Principal contact info
 * 
 * WHEN TO CALL:
 * - When user updates their profile
 * - When user adds/changes email or phone
 * 
 * @param principal_id - Data Principal ID
 * @param updates - Fields to update
 */
export const updateDataPrincipal = async (
  principal_id: string,
  updates: {
    email?: string;
    phone?: string;
    language?: string;
  }
): Promise<RegisterDataPrincipalResponse> => {
  try {
    const principal = await prisma.dataPrincipal.update({
      where: { data_principal_id: principal_id },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    });

    logger.info(`[DATA-PRINCIPAL] Updated user: ${principal_id}`);

    return {
      data_principal_id: principal.data_principal_id,
      external_id: principal.external_id!,
      email: principal.email || undefined,
      phone: principal.phone || undefined,
      language: principal.language,
      created_at: principal.created_at,
    };
  } catch (error) {
    logger.error("[DATA-PRINCIPAL] Error updating user:", error);
    throw error;
  }
};

/**
 * Get Data Principal by external ID
 */
export const getDataPrincipalByExternalId = async (
  external_user_id: string
): Promise<RegisterDataPrincipalResponse | null> => {
  const principal = await prisma.dataPrincipal.findUnique({
    where: { external_id: external_user_id },
  });

  if (!principal) {
    return null;
  }

  return {
    data_principal_id: principal.data_principal_id,
    external_id: principal.external_id!,
    email: principal.email || undefined,
    phone: principal.phone || undefined,
    language: principal.language,
    created_at: principal.created_at,
  };
};

/**
 * Generate audit hash
 */
function generateAuditHash(data: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}


