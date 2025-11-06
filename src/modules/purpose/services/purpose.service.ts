/**
 * @fileoverview Service layer for Purpose business logic.
 * @module modules/purpose/services
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import * as PurposeTypes from "@/modules/purpose/interfaces/purpose.interface";

/**
 * Retrieves all purposes with pagination, search, and filtering.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID to filter purposes.
 * @param {number} page - Page number for pagination (default is 1).
 * @param {number} limit - Number of items per page (default is 10).
 * @param {string} [q] - Search term for filtering by title or description.
 * @param {string} [purpose_category_id] - Filter by purpose category ID.
 * @param {boolean} [is_active] - Filter by active status.
 * @param {boolean} [is_mandatory] - Filter by mandatory status.
 * @param {boolean} [requires_renewal] - Filter by renewal requirement.
 * @param {string} sort_by - Field to sort by (default: 'display_order').
 * @param {'asc' | 'desc'} sort_order - Sort order (default: 'asc').
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedPurposeResponse>>} API response with paginated list.
 * @throws {Error} Throws an error if retrieval fails.
 */
export const getAllPurposes = async (
  data_fiduciary_id: string,
  page: number = 1,
  limit: number = 10,
  q?: string,
  purpose_category_id?: string,
  is_active?: boolean,
  is_mandatory?: boolean,
  requires_renewal?: boolean,
  sort_by: string = "display_order",
  sort_order: "asc" | "desc" = "asc"
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedPurposeResponse>> => {
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      data_fiduciary_id,
    };

    if (q) {
      const searchTerms = q.split(/\s+/).filter(Boolean);

      if (searchTerms.length > 0) {
        where.OR = [
          ...searchTerms.map((term) => ({
            title: { contains: term, mode: "insensitive" },
          })),
          ...searchTerms.map((term) => ({
            description: { contains: term, mode: "insensitive" },
          })),
        ];
      }
    }

    if (purpose_category_id) {
      where.purpose_category_id = purpose_category_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (is_mandatory !== undefined) {
      where.is_mandatory = is_mandatory;
    }

    if (requires_renewal !== undefined) {
      where.requires_renewal = requires_renewal;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // Get purposes with counts
    const purposes = await prisma.purpose.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            purpose_category_id: true,
            name: true,
          },
        },
        _count: {
          select: {
            purpose_version: true,
            translations: true,
          },
        },
      },
      orderBy,
    });

    // Get total count
    const totalPurposes = await prisma.purpose.count({ where });

    // Transform purposes
    const transformedPurposes = purposes.map(({ _count, ...purpose }) => ({
      ...purpose,
      total_versions: _count.purpose_version,
      total_translations: _count.translations,
    }));

    return {
      success: true,
      message: "Purposes retrieved successfully",
      data: {
        data: transformedPurposes,
        meta: {
          pagination: {
            total_purposes: totalPurposes,
            limit,
            current_page: page,
            total_pages: Math.ceil(totalPurposes / limit),
          },
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets a specific purpose by ID.
 * 
 * @param {string} purpose_id - The purpose ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts | null>>} API response with purpose data.
 * @throws {AppError} Throws an error if purpose not found or unauthorized access.
 */
export const getPurposeById = async (
  purpose_id: string,
  data_fiduciary_id: string
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts | null>> => {
  try {
    const purpose = await prisma.purpose.findUnique({
      where: { purpose_id },
      include: {
        category: {
          select: {
            purpose_category_id: true,
            name: true,
          },
        },
        _count: {
          select: {
            purpose_version: true,
            translations: true,
          },
        },
      },
    });

    if (!purpose) {
      throw new AppError("Purpose not found", 404);
    }

    // Authorization check
    if (purpose.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this purpose", 403);
    }

    // Transform purpose
    const { _count, ...rest } = purpose;
    return {
      success: true,
      message: "Purpose retrieved successfully",
      data: {
        ...rest,
        total_versions: _count.purpose_version,
        total_translations: _count.translations,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new purpose.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID.
 * @param {string} [purpose_category_id] - Optional purpose category ID.
 * @param {string} title - Purpose title.
 * @param {string} [description] - Purpose description.
 * @param {string} [legal_basis] - Legal basis reference.
 * @param {string[]} data_fields - Array of data fields.
 * @param {string[]} processing_activities - Array of processing activities.
 * @param {number} [retention_period_days] - Retention period in days.
 * @param {boolean} [is_mandatory] - Whether consent is mandatory.
 * @param {boolean} [is_active] - Active status.
 * @param {boolean} [requires_renewal] - Whether requires renewal.
 * @param {number} [renewal_period_days] - Renewal period in days.
 * @param {number} [display_order] - Display order.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>>} API response with created purpose.
 * @throws {AppError} Throws an error if creation fails.
 */
export const createPurpose = async (
  data_fiduciary_id: string,
  purpose_category_id: string | undefined,
  title: string,
  description: string | undefined,
  legal_basis: string | undefined,
  data_fields: string[],
  processing_activities: string[],
  retention_period_days: number | undefined,
  is_mandatory: boolean = false,
  is_active: boolean = true,
  requires_renewal: boolean = false,
  renewal_period_days: number | undefined,
  display_order: number = 0
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>> => {
  try {
    // Validate data fiduciary exists
    const fiduciary = await prisma.dataFiduciary.findUnique({
      where: { data_fiduciary_id },
    });

    if (!fiduciary) {
      throw new AppError("Data fiduciary not found", 404);
    }

    // Validate purpose category if provided
    if (purpose_category_id) {
      const category = await prisma.purposeCategory.findUnique({
        where: { purpose_category_id },
      });

      if (!category) {
        throw new AppError("Purpose category not found", 404);
      }

      if (category.data_fiduciary_id !== data_fiduciary_id) {
        throw new AppError("Purpose category does not belong to this data fiduciary", 400);
      }
    }

    // Validate renewal logic
    if (requires_renewal && !renewal_period_days) {
      throw new AppError("Renewal period is required when requires_renewal is true", 400);
    }

    // Create new purpose with PurposeVersion in a transaction
    const newPurpose = await prisma.$transaction(async (tx) => {
      // Create the purpose
      const purpose = await tx.purpose.create({
        data: {
          data_fiduciary_id,
          purpose_category_id: purpose_category_id || null,
          title,
          description: description || null,
          legal_basis: legal_basis || null,
          data_fields,
          processing_activities,
          retention_period_days: retention_period_days || null,
          is_mandatory,
          is_active,
          requires_renewal,
          renewal_period_days: renewal_period_days || null,
          display_order,
        },
        include: {
          category: {
            select: {
              purpose_category_id: true,
              name: true,
            },
          },
        },
      });

      // Create the first version (v1)
      await tx.purposeVersion.create({
        data: {
          purpose_id: purpose.purpose_id,
          version_number: 1,
          title,
          description: description || null,
          language_code: 'en',
          is_current: true,
          published_at: new Date(),
        },
      });

      return purpose;
    });

    return {
      success: true,
      message: "Purpose created successfully",
      data: {
        ...newPurpose,
        total_versions: 1,
        total_translations: 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Updates a purpose.
 * 
 * @param {string} purpose_id - The purpose ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * @param {string} [purpose_category_id] - Purpose category ID.
 * @param {string} [title] - Purpose title.
 * @param {string | null} [description] - Purpose description.
 * @param {string | null} [legal_basis] - Legal basis reference.
 * @param {string[]} [data_fields] - Array of data fields.
 * @param {string[]} [processing_activities] - Array of processing activities.
 * @param {number | null} [retention_period_days] - Retention period in days.
 * @param {boolean} [is_mandatory] - Whether consent is mandatory.
 * @param {boolean} [is_active] - Active status.
 * @param {boolean} [requires_renewal] - Whether requires renewal.
 * @param {number | null} [renewal_period_days] - Renewal period in days.
 * @param {number} [display_order] - Display order.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>>} API response with updated purpose.
 * @throws {AppError} Throws an error if purpose not found, unauthorized, or update fails.
 */
export const updatePurpose = async (
  purpose_id: string,
  data_fiduciary_id: string,
  purpose_category_id?: string | null,
  title?: string,
  description?: string | null,
  legal_basis?: string | null,
  data_fields?: string[],
  processing_activities?: string[],
  retention_period_days?: number | null,
  is_mandatory?: boolean,
  is_active?: boolean,
  requires_renewal?: boolean,
  renewal_period_days?: number | null,
  display_order?: number
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>> => {
  try {
    // Check if purpose exists
    const existingPurpose = await prisma.purpose.findUnique({
      where: { purpose_id },
    });

    if (!existingPurpose) {
      throw new AppError("Purpose not found", 404);
    }

    // Authorization check
    if (existingPurpose.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this purpose", 403);
    }

    // Validate purpose category if provided
    if (purpose_category_id !== undefined && purpose_category_id !== null) {
      const category = await prisma.purposeCategory.findUnique({
        where: { purpose_category_id },
      });

      if (!category) {
        throw new AppError("Purpose category not found", 404);
      }

      if (category.data_fiduciary_id !== data_fiduciary_id) {
        throw new AppError("Purpose category does not belong to this data fiduciary", 400);
      }
    }

    // Validate renewal logic
    const finalRequiresRenewal = requires_renewal !== undefined ? requires_renewal : existingPurpose.requires_renewal;
    const finalRenewalPeriodDays = renewal_period_days !== undefined ? renewal_period_days : existingPurpose.renewal_period_days;

    if (finalRequiresRenewal && !finalRenewalPeriodDays) {
      throw new AppError("Renewal period is required when requires_renewal is true", 400);
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date(),
    };

    if (purpose_category_id !== undefined) updateData.purpose_category_id = purpose_category_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (legal_basis !== undefined) updateData.legal_basis = legal_basis;
    if (data_fields !== undefined) updateData.data_fields = data_fields;
    if (processing_activities !== undefined) updateData.processing_activities = processing_activities;
    if (retention_period_days !== undefined) updateData.retention_period_days = retention_period_days;
    if (is_mandatory !== undefined) updateData.is_mandatory = is_mandatory;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (requires_renewal !== undefined) updateData.requires_renewal = requires_renewal;
    if (renewal_period_days !== undefined) updateData.renewal_period_days = renewal_period_days;
    if (display_order !== undefined) updateData.display_order = display_order;

    // Check if any significant field changed to create a new version
    const titleChanged = title !== undefined && title !== existingPurpose.title;
    const descriptionChanged = description !== undefined && description !== existingPurpose.description;
    const categoryChanged = purpose_category_id !== undefined && purpose_category_id !== existingPurpose.purpose_category_id;
    const legalBasisChanged = legal_basis !== undefined && legal_basis !== existingPurpose.legal_basis;
    const retentionChanged = retention_period_days !== undefined && retention_period_days !== existingPurpose.retention_period_days;
    const mandatoryChanged = is_mandatory !== undefined && is_mandatory !== existingPurpose.is_mandatory;
    const renewalChanged = requires_renewal !== undefined && requires_renewal !== existingPurpose.requires_renewal;
    const renewalPeriodChanged = renewal_period_days !== undefined && renewal_period_days !== existingPurpose.renewal_period_days;
    
    // Check if arrays changed (data_fields, processing_activities)
    const dataFieldsChanged = data_fields !== undefined && JSON.stringify(data_fields.sort()) !== JSON.stringify(existingPurpose.data_fields.sort());
    const processingActivitiesChanged = processing_activities !== undefined && JSON.stringify(processing_activities.sort()) !== JSON.stringify(existingPurpose.processing_activities.sort());
    
    const shouldCreateVersion = titleChanged || descriptionChanged || categoryChanged || legalBasisChanged || retentionChanged || mandatoryChanged || renewalChanged || renewalPeriodChanged || dataFieldsChanged || processingActivitiesChanged;

    // Update purpose with optional version creation in a transaction
    const updatedPurpose = await prisma.$transaction(async (tx) => {
      // Update the purpose
      const purpose = await tx.purpose.update({
        where: { purpose_id },
        data: updateData,
        include: {
          category: {
            select: {
              purpose_category_id: true,
              name: true,
            },
          },
          _count: {
            select: {
              purpose_version: true,
              translations: true,
            },
          },
        },
      });

      // Create new version if title or description changed
      if (shouldCreateVersion) {
        // Mark all existing versions as not current
        await tx.purposeVersion.updateMany({
          where: { 
            purpose_id,
            is_current: true,
          },
          data: { 
            is_current: false,
            deprecated_at: new Date(),
          },
        });

        // Get the highest version number
        const lastVersion = await tx.purposeVersion.findFirst({
          where: { purpose_id },
          orderBy: { version_number: 'desc' },
          select: { version_number: true },
        });

        const newVersionNumber = (lastVersion?.version_number || 0) + 1;

        // Create new version
        await tx.purposeVersion.create({
          data: {
            purpose_id,
            version_number: newVersionNumber,
            title: title !== undefined ? title : existingPurpose.title,
            description: description !== undefined ? description : existingPurpose.description,
            language_code: 'en',
            is_current: true,
            published_at: new Date(),
          },
        });
      }

      return purpose;
    });

    // Transform to add counts
    const { _count, ...rest } = updatedPurpose;
    return {
      success: true,
      message: "Purpose updated successfully",
      data: {
        ...rest,
        total_versions: _count.purpose_version,
        total_translations: _count.translations,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Toggles the active status of a purpose.
 * 
 * @param {string} purpose_id - The purpose ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>>} API response with updated purpose.
 * @throws {AppError} Throws an error if toggle fails, purpose not found, or unauthorized.
 */
export const togglePurposeStatus = async (
  purpose_id: string,
  data_fiduciary_id: string
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeWithCounts>> => {
  try {
    const purpose = await prisma.purpose.findUnique({
      where: { purpose_id },
    });

    if (!purpose) {
      throw new AppError("Purpose not found", 404);
    }

    // Authorization check
    if (purpose.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this purpose", 403);
    }

    const updatedPurpose = await prisma.purpose.update({
      where: { purpose_id },
      data: {
        is_active: !purpose.is_active,
        updated_at: new Date(),
      },
      include: {
        category: {
          select: {
            purpose_category_id: true,
            name: true,
          },
        },
        _count: {
          select: {
            purpose_version: true,
            translations: true,
          },
        },
      },
    });

    const message = updatedPurpose.is_active ? "Purpose is now active" : "Purpose is now inactive";

    // Transform to add counts
    const { _count, ...rest } = updatedPurpose;

    return {
      success: true,
      message,
      data: {
        ...rest,
        total_versions: _count.purpose_version,
        total_translations: _count.translations,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes a purpose (hard delete).
 * IMPORTANT: Can only delete if NO ConsentArtifacts exist for any of its versions.
 * If consent artifacts exist, the purpose should be made inactive instead.
 * 
 * @param {string} purpose_id - The purpose ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<null>>} API response with deletion confirmation.
 * @throws {AppError} Throws an error if deletion fails, purpose not found, unauthorized, or has consent artifacts.
 */
export const deletePurpose = async (purpose_id: string, data_fiduciary_id: string): Promise<PurposeTypes.ApiResponse<null>> => {
  try {
    // Check if purpose exists and get all its versions
    const existingPurpose = await prisma.purpose.findUnique({
      where: { purpose_id },
      include: {
        purpose_version: {
          include: {
            _count: {
              select: {
                consents: true,
              },
            },
          },
        },
      },
    });

    if (!existingPurpose) {
      throw new AppError("Purpose not found", 404);
    }

    // Authorization check
    if (existingPurpose.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this purpose", 403);
    }

    // Check if ANY version has associated consent artifacts
    const hasConsentArtifacts = existingPurpose.purpose_version.some(
      (version) => version._count.consents > 0
    );

    if (hasConsentArtifacts) {
      throw new AppError(
        "Cannot delete: This purpose has consent artifacts. Please make the purpose inactive instead of deleting it to maintain consent history and compliance.",
        400
      );
    }

    // Hard delete - permanently remove the purpose and all its versions in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all purpose versions first (due to foreign key constraints)
      await tx.purposeVersion.deleteMany({
        where: { purpose_id },
      });

      // Delete all purpose translations
      await tx.purposeTranslation.deleteMany({
        where: { purpose_id },
      });

      // Delete the purpose
      await tx.purpose.delete({
        where: { purpose_id },
      });
    });

    return {
      success: true,
      message: "Purpose and all associated versions deleted successfully",
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets purpose analytics summary.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID to filter analytics.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeAnalyticsResponse>>} API response with analytics data.
 * @throws {Error} Throws an error if retrieving analytics fails.
 */
export const getPurposeAnalytics = async (data_fiduciary_id: string): Promise<PurposeTypes.ApiResponse<PurposeTypes.PurposeAnalyticsResponse>> => {
  try {
    const [
      totalPurposes,
      totalActivePurposes,
      totalInactivePurposes,
      totalMandatoryPurposes,
      totalOptionalPurposes,
      recentlyCreated,
      purposesByStatus,
      purposesByCategory,
      topPurposesByVersions,
      newPurposesTrend,
    ] = await Promise.all([
      // Total purposes count
      prisma.purpose.count({
        where: { data_fiduciary_id },
      }),
      // Active purposes count
      prisma.purpose.count({
        where: { data_fiduciary_id, is_active: true },
      }),
      // Inactive purposes count
      prisma.purpose.count({
        where: { data_fiduciary_id, is_active: false },
      }),
      // Mandatory purposes count
      prisma.purpose.count({
        where: { data_fiduciary_id, is_mandatory: true },
      }),
      // Optional purposes count
      prisma.purpose.count({
        where: { data_fiduciary_id, is_mandatory: false },
      }),
      // Recently created purposes (last 30 days)
      prisma.purpose.count({
        where: {
          data_fiduciary_id,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Purposes by active status
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN is_active = true THEN 'active'
            WHEN is_active = false THEN 'inactive'
            ELSE 'unknown'
          END as status,
          COUNT(*) as count
        FROM "Purpose"
        WHERE data_fiduciary_id = ${data_fiduciary_id}
        GROUP BY 
          CASE 
            WHEN is_active = true THEN 'active'
            WHEN is_active = false THEN 'inactive'
            ELSE 'unknown'
          END
      `,
      // Purposes by category
      prisma.$queryRaw`
        SELECT 
          COALESCE(pc.name, 'Uncategorized') as category_name,
          COUNT(p.purpose_id) as count
        FROM "Purpose" p
        LEFT JOIN "purpose_categories" pc ON p.purpose_category_id = pc.purpose_category_id
        WHERE p.data_fiduciary_id = ${data_fiduciary_id}
        GROUP BY pc.name
        ORDER BY count DESC
      `,
      // Top purposes by version count
      prisma.purpose.findMany({
        where: { data_fiduciary_id },
        include: {
          category: {
            select: {
              purpose_category_id: true,
              name: true,
            },
          },
          _count: {
            select: {
              purpose_version: true,
              translations: true,
            },
          },
        },
        orderBy: {
          purpose_version: {
            _count: "desc",
          },
        },
        take: 10,
      }),
      // New purposes trend (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM "Purpose"
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND data_fiduciary_id = ${data_fiduciary_id}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `,
    ]);

    // Convert BigInt to Number for JSON serialization
    const convertedPurposesByStatus = (purposesByStatus as any[]).map((item) => ({
      status: item.status,
      count: Number(item.count),
    }));

    const convertedPurposesByCategory = (purposesByCategory as any[]).map((item) => ({
      category_name: item.category_name,
      count: Number(item.count),
    }));

    const convertedNewPurposesTrend = (newPurposesTrend as any[]).map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    return {
      success: true,
      message: "Purpose analytics retrieved successfully",
      data: {
        purpose_counts: {
          total_purposes: totalPurposes,
          active_purposes: totalActivePurposes,
          inactive_purposes: totalInactivePurposes,
          mandatory_purposes: totalMandatoryPurposes,
          optional_purposes: totalOptionalPurposes,
          recently_created: recentlyCreated,
        },
        purpose_trends: {
          new_purposes_by_month: convertedNewPurposesTrend,
        },
        purpose_distributions: {
          purposes_by_status: convertedPurposesByStatus,
          purposes_by_category: convertedPurposesByCategory,
          top_purposes_by_versions: topPurposesByVersions.map(({ _count, ...p }) => ({
            ...p,
            total_versions: _count.purpose_version,
            total_translations: _count.translations,
          })),
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets purposes grouped by category for a specific fiduciary.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID.
 * @param {number} page - Page number (default: 1).
 * @param {number} limit - Items per page (default: 10).
 * @param {string} [q] - Search query to filter by category name.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedGroupedByCategoryResponse>>} API response with grouped purposes.
 * @throws {AppError} Throws an error if query fails.
 */
export const getPurposesGroupedByCategory = async (data_fiduciary_id: string, page: number = 1, limit: number = 10, q?: string): Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedGroupedByCategoryResponse>> => {
  try {
    const skip = (page - 1) * limit;

    // Build search filter for category name
    const categoryWhere = q
      ? {
          name: {
            contains: q,
            mode: "insensitive" as const,
          },
          data_fiduciary_id,
        }
      : { data_fiduciary_id };

    // Get total count of categories matching the search
    const totalCategories = await prisma.purposeCategory.count({
      where: categoryWhere,
    });

    // Get categories with search filter and pagination
    const categories = await prisma.purposeCategory.findMany({
      where: categoryWhere,
      select: {
        purpose_category_id: true,
        name: true,
      },
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    });

    const categoryIds = categories.map((c) => c.purpose_category_id);

    // Group purposes by purpose_category_id and count
    const groupedPurposes = await prisma.purpose.groupBy({
      by: ["purpose_category_id"],
      where: {
        data_fiduciary_id,
        purpose_category_id: {
          in: categoryIds,
        },
      },
      _count: {
        purpose_id: true,
      },
    });

    // Get count of uncategorized purposes
    const uncategorizedCount = await prisma.purpose.count({
      where: {
        data_fiduciary_id,
        purpose_category_id: null,
      },
    });

    // Combine grouped data with category names
    const result: PurposeTypes.PurposeGroupedByCategory[] = categories.map((category) => {
      const group = groupedPurposes.find((g) => g.purpose_category_id === category.purpose_category_id);
      return {
        purpose_category_id: category.purpose_category_id,
        purpose_category_name: category.name,
        total_purposes: group?._count.purpose_id || 0,
      };
    });

    // Add uncategorized if searching for it or if on first page without search
    if ((!q || "uncategorized".includes(q.toLowerCase())) && page === 1) {
      result.unshift({
        purpose_category_id: null,
        purpose_category_name: null,
        total_purposes: uncategorizedCount,
      });
    }

    return {
      success: true,
      message: "Purposes grouped by category retrieved successfully",
      data: {
        data: result,
        meta: {
          pagination: {
            total_categories: totalCategories + (uncategorizedCount > 0 ? 1 : 0),
            limit,
            current_page: page,
            total_pages: Math.ceil((totalCategories + (uncategorizedCount > 0 ? 1 : 0)) / limit),
          },
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets analytics for purposes grouped by data fiduciary (global statistics).
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.GroupedPurposesAnalyticsResponse>>} API response with analytics data.
 * @throws {Error} Throws an error if retrieving analytics fails.
 */
export const getGroupedPurposesAnalytics = async (): Promise<PurposeTypes.ApiResponse<PurposeTypes.GroupedPurposesAnalyticsResponse>> => {
  try {
    // Get total number of fiduciaries
    const totalFiduciaries = await prisma.dataFiduciary.count();

    // Get total number of purposes across all fiduciaries
    const totalPurposes = await prisma.purpose.count();

    // Get all fiduciaries with their purpose counts
    const fiduciaries = await prisma.dataFiduciary.findMany({
      select: {
        data_fiduciary_id: true,
        name: true,
      },
    });

    const fiduciaryIds = fiduciaries.map((f) => f.data_fiduciary_id);

    // Group purposes by data_fiduciary_id and count
    const groupedPurposes = await prisma.purpose.groupBy({
      by: ["data_fiduciary_id"],
      where: {
        data_fiduciary_id: {
          in: fiduciaryIds,
        },
      },
      _count: {
        purpose_id: true,
      },
      orderBy: {
        _count: {
          purpose_id: "desc",
        },
      },
    });

    // Calculate statistics
    const fiduciariesWithPurposes = groupedPurposes.length;
    const fiduciariesWithoutPurposes = totalFiduciaries - fiduciariesWithPurposes;
    const averagePurposesPerFiduciary = totalFiduciaries > 0 
      ? Math.round((totalPurposes / totalFiduciaries) * 100) / 100 
      : 0;

    // Get top 10 fiduciaries by purpose count
    const topFiduciaries: PurposeTypes.PurposeGroupedByFiduciary[] = groupedPurposes
      .slice(0, 10)
      .map((group) => {
        const fiduciary = fiduciaries.find((f) => f.data_fiduciary_id === group.data_fiduciary_id);
        return {
          data_fiduciary_id: group.data_fiduciary_id,
          data_fiduciary_name: fiduciary?.name || "Unknown",
          total_purposes: group._count.purpose_id,
        };
      });

    return {
      success: true,
      message: "Grouped purposes analytics retrieved successfully",
      data: {
        total_fiduciaries: totalFiduciaries,
        total_purposes: totalPurposes,
        average_purposes_per_fiduciary: averagePurposesPerFiduciary,
        fiduciaries_with_purposes: fiduciariesWithPurposes,
        fiduciaries_without_purposes: fiduciariesWithoutPurposes,
        top_fiduciaries_by_purposes: topFiduciaries,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets all purposes grouped by data fiduciary with counts.
 * 
 * @param {number} page - Page number (default: 1).
 * @param {number} limit - Items per page (default: 10).
 * @param {string} [q] - Search query to filter by fiduciary name.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedGroupedByFiduciaryResponse>>} API response with grouped purposes and pagination.
 * @throws {AppError} Throws an error if query fails.
 */
export const getPurposesGroupedByFiduciary = async (
  page: number = 1,
  limit: number = 10,
  q?: string
): Promise<PurposeTypes.ApiResponse<PurposeTypes.PaginatedGroupedByFiduciaryResponse>> => {
  try {
    const skip = (page - 1) * limit;

    // Build search filter for fiduciary name
    const fiduciaryWhere = q
      ? {
          name: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {};

    // Get total count of fiduciaries matching the search
    const totalFiduciaries = await prisma.dataFiduciary.count({
      where: fiduciaryWhere,
    });

    // Get fiduciaries with search filter and pagination
    const fiduciaries = await prisma.dataFiduciary.findMany({
      where: fiduciaryWhere,
      select: {
        data_fiduciary_id: true,
        name: true,
      },
      skip,
      take: limit,
      orderBy: {
        name: "asc",
      },
    });

    const fiduciaryIds = fiduciaries.map((f) => f.data_fiduciary_id);

    // Group purposes by data_fiduciary_id and count for the filtered fiduciaries
    const groupedPurposes = await prisma.purpose.groupBy({
      by: ["data_fiduciary_id"],
      where: {
        data_fiduciary_id: {
          in: fiduciaryIds,
        },
      },
      _count: {
        purpose_id: true,
      },
    });

    // Combine grouped data with fiduciary names
    const result: PurposeTypes.PurposeGroupedByFiduciary[] = fiduciaries.map((fiduciary) => {
      const group = groupedPurposes.find((g) => g.data_fiduciary_id === fiduciary.data_fiduciary_id);
      return {
        data_fiduciary_id: fiduciary.data_fiduciary_id,
        data_fiduciary_name: fiduciary.name,
        total_purposes: group?._count.purpose_id || 0,
      };
    });

    return {
      success: true,
      message: "Purposes grouped by data fiduciary retrieved successfully",
      data: {
        data: result,
        meta: {
          pagination: {
            total_fiduciaries: totalFiduciaries,
            limit,
            current_page: page,
            total_pages: Math.ceil(totalFiduciaries / limit),
          },
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets the complete version history of a purpose.
 * Returns all versions ordered by version number (latest first).
 * 
 * @param {string} purpose_id - The purpose ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeTypes.ApiResponse<any>>} API response with purpose version history.
 * @throws {AppError} Throws an error if purpose not found or unauthorized access.
 */
export const getPurposeHistory = async (
  purpose_id: string,
  data_fiduciary_id: string
): Promise<PurposeTypes.ApiResponse<any>> => {
  try {
    // Check if purpose exists
    const purpose = await prisma.purpose.findUnique({
      where: { purpose_id },
      select: {
        purpose_id: true,
        data_fiduciary_id: true,
        title: true,
        description: true,
        purpose_category_id: true,
        legal_basis: true,
        data_fields: true,
        processing_activities: true,
        retention_period_days: true,
        is_mandatory: true,
        is_active: true,
        requires_renewal: true,
        renewal_period_days: true,
        display_order: true,
        created_at: true,
        updated_at: true,
        category: {
          select: {
            purpose_category_id: true,
            name: true,
          },
        },
      },
    });

    if (!purpose) {
      throw new AppError("Purpose not found", 404);
    }

    // Authorization check
    if (purpose.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this purpose", 403);
    }

    // Get all versions of this purpose
    const versions = await prisma.purposeVersion.findMany({
      where: { purpose_id },
      orderBy: { version_number: 'desc' }, // Latest first
      select: {
        purpose_version_id: true,
        version_number: true,
        title: true,
        description: true,
        language_code: true,
        is_current: true,
        created_at: true,
        published_at: true,
        deprecated_at: true,
        _count: {
          select: {
            consents: true,
          },
        },
      },
    });

    // Get total consent count across all versions
    const totalConsents = versions.reduce((sum, version) => sum + version._count.consents, 0);

    // Transform versions to include consent count
    const transformedVersions = versions.map(({ _count, ...version }) => ({
      ...version,
      consent_count: _count.consents,
      status: version.is_current 
        ? 'current' 
        : version.deprecated_at 
          ? 'deprecated' 
          : 'archived',
    }));

    return {
      success: true,
      message: "Purpose history retrieved successfully",
      data: {
        purpose: {
          purpose_id: purpose.purpose_id,
          title: purpose.title,
          description: purpose.description,
          category: purpose.category,
          legal_basis: purpose.legal_basis,
          data_fields: purpose.data_fields,
          processing_activities: purpose.processing_activities,
          retention_period_days: purpose.retention_period_days,
          is_mandatory: purpose.is_mandatory,
          is_active: purpose.is_active,
          requires_renewal: purpose.requires_renewal,
          renewal_period_days: purpose.renewal_period_days,
          display_order: purpose.display_order,
          created_at: purpose.created_at,
          updated_at: purpose.updated_at,
        },
        version_history: {
          total_versions: versions.length,
          total_consents: totalConsents,
          current_version: transformedVersions.find((v) => v.is_current)?.version_number || null,
          versions: transformedVersions,
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

