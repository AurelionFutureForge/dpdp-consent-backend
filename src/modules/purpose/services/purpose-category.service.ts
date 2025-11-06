/**
 * @fileoverview Service layer for Purpose Category business logic.
 * @module modules/purpose/services
 */

import prisma from "prisma/client/prismaClient";
import { AppError } from "@/modules/common/middlewares";
import * as PurposeCategoryTypes from "@/modules/purpose/interfaces/purpose-category.interface";

/**
 * Retrieves all purpose categories with pagination, search, and filtering.
 * For analytics data, use the getPurposeCategoryAnalytics endpoint.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID to filter categories.
 * @param {number} page - Page number for pagination (default is 1).
 * @param {number} limit - Number of items per page (default is 10).
 * @param {string} [q] - Search term for filtering by name or description.
 * @param {boolean} [is_active] - Filter by active status.
 * @param {string} sort_by - Field to sort by (default: 'display_order').
 * @param {'asc' | 'desc'} sort_order - Sort order (default: 'asc').
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PaginatedPurposeCategoryResponse>>} API response with paginated list.
 * @throws {Error} Throws an error if retrieval fails.
 */
export const getAllPurposeCategories = async (
  data_fiduciary_id: string,
  page: number = 1,
  limit: number = 10,
  q?: string,
  is_active?: boolean,
  sort_by: string = "display_order",
  sort_order: "asc" | "desc" = "asc"
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PaginatedPurposeCategoryResponse>> => {
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      data_fiduciary_id,  // Filter by fiduciary
    };

    if (q) {
      // Split the search query by spaces to allow searching for multiple terms
      const searchTerms = q.split(/\s+/).filter(Boolean);

      if (searchTerms.length > 0) {
        where.OR = [
          ...searchTerms.map((term) => ({
            name: { contains: term, mode: "insensitive" },
          })),
          ...searchTerms.map((term) => ({
            description: { contains: term, mode: "insensitive" },
          })),
        ];
      }
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // Get categories with counts of associated purposes
    const categories = await prisma.purposeCategory.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: { purposes: true },
        },
      },
      orderBy,
    });

    // Get total count for current query
    const totalCategories = await prisma.purposeCategory.count({ where });

    // Transform categories to rename _count to total_purposes
    const transformedCategories = categories.map(({ _count, ...category }) => ({
      ...category,
      total_purposes: _count.purposes,
    }));

    return {
      success: true,
      message: "Purpose categories retrieved successfully",
      data: {
        data: transformedCategories,
        meta: {
          pagination: {
            total_categories: totalCategories,
            limit,
            current_page: page,
            total_pages: Math.ceil(totalCategories / limit),
          },
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets a specific purpose category by ID.
 * 
 * @param {string} purpose_category_id - The purpose category ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount | null>>} API response with purpose category data.
 * @throws {AppError} Throws an error if category not found or unauthorized access.
 */
export const getPurposeCategoryById = async (
  purpose_category_id: string,
  data_fiduciary_id: string
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount | null>> => {
  try {
    const category = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
      include: {
        _count: {
          select: { purposes: true },
        },
      },
    });

    if (!category) {
      throw new AppError("Purpose category not found", 404);
    }

    // Authorization check: Ensure category belongs to the requesting fiduciary
    if (category.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this category", 403);
    }

    // Transform category to rename _count to total_purposes
    const { _count, ...rest } = category;
    return {
      success: true,
      message: "Purpose category retrieved successfully",
      data: {
        ...rest,
        total_purposes: _count.purposes,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new purpose category.
 * 
 * @param {PurposeCategoryTypes.CreatePurposeCategoryInput} data - The category data to create.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>>} API response with created category.
 * @throws {AppError} Throws an error if creation fails.
 */
export const createPurposeCategory = async (
  data_fiduciary_id: string,
  name: string,
  description?: string,
  display_order?: number,
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>> => {
  try {
    // Check if name is unique for this fiduciary
    const existingCategory = await prisma.purposeCategory.findFirst({
      where: {
        data_fiduciary_id: data_fiduciary_id,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existingCategory) {
      throw new AppError("Purpose category with this name already exists for your organization", 400);
    }

    // Create new category
    const newCategory = await prisma.purposeCategory.create({
      data: {
        data_fiduciary_id: data_fiduciary_id,
        name: name,
        description: description,
        display_order: display_order !== undefined ? display_order : 0,
      },
    });

    // Add total_purposes field for consistency
    return {
      success: true,
      message: "Purpose category created successfully",
      data: {
        ...newCategory,
        total_purposes: 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Updates a purpose category.
 * 
 * @param {string} purpose_category_id - The purpose category ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * @param {PurposeCategoryTypes.UpdatePurposeCategoryInput} data - The data to update.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>>} API response with updated category.
 * @throws {AppError} Throws an error if category not found, unauthorized, or update fails.
 */
export const updatePurposeCategory = async (
  purpose_category_id: string,
  data_fiduciary_id: string,
  name?: string,
  description?: string | null,
  display_order?: number,
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>> => {
  try {
    // Check if category exists
    const existingCategory = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
    });

    if (!existingCategory) {
      throw new AppError("Purpose category not found", 404);
    }

    // Authorization check: Ensure category belongs to the requesting fiduciary
    if (existingCategory.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this category", 403);
    }

    // If name is changing, check if it's unique for this fiduciary
    if (name &&  name !== existingCategory.name) {
      const nameExists = await prisma.purposeCategory.findFirst({
        where: {
          data_fiduciary_id,
          name: { equals: name, mode: "insensitive" },
          purpose_category_id: { not: purpose_category_id },
        },
      });

      if (nameExists) {
        throw new AppError("Purpose category with this name already exists for your organization", 400);
      }
    }

    // Update category
    const updatedCategory = await prisma.purposeCategory.update({
      where: { purpose_category_id },
      data: {
        name: name,
        description: description,
        display_order: display_order !== undefined ? display_order : existingCategory.display_order,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: { purposes: true },
        },
      },
    });

    // Transform to add total_purposes field
    const { _count, ...rest } = updatedCategory;
    return {
      success: true,
      message: "Purpose category updated successfully",
      data: {
        ...rest,
        total_purposes: _count.purposes,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Toggles the active status of a purpose category.
 * 
 * @param {string} purpose_category_id - The purpose category ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>>} API response with updated category.
 * @throws {AppError} Throws an error if toggle fails, category not found, or unauthorized.
 */
export const togglePurposeCategoryStatus = async (
  purpose_category_id: string,
  data_fiduciary_id: string
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryWithCount>> => {
  try {
    const category = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
    });

    if (!category) {
      throw new AppError("Purpose category not found", 404);
    }

    // Authorization check: Ensure category belongs to the requesting fiduciary
    if (category.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this category", 403);
    }

    const updatedCategory = await prisma.purposeCategory.update({
      where: { purpose_category_id },
      data: {
        is_active: !category.is_active,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: { purposes: true },
        },
      },
    });

    const message = updatedCategory.is_active ? "Purpose category is now active" : "Purpose category is now inactive";

    // Transform to add total_purposes field
    const { _count, ...rest } = updatedCategory;

    return {
      success: true,
      message,
      data: {
        ...rest,
        total_purposes: _count.purposes,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes a purpose category (hard delete).
 * 
 * @param {string} purpose_category_id - The purpose category ID.
 * @param {string} data_fiduciary_id - Data fiduciary ID for authorization check.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<null>>} API response with deletion confirmation.
 * @throws {AppError} Throws an error if deletion fails, category not found, or unauthorized.
 */
export const deletePurposeCategory = async (
  purpose_category_id: string,
  data_fiduciary_id: string
): Promise<PurposeCategoryTypes.ApiResponse<null>> => {
  try {
    // Check if category exists
    const existingCategory = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
      include: {
        _count: {
          select: { purposes: true },
        },
      },
    });

    if (!existingCategory) {
      throw new AppError("Purpose category not found", 404);
    }

    // Authorization check: Ensure category belongs to the requesting fiduciary
    if (existingCategory.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Unauthorized: You don't have access to this category", 403);
    }

    // Check if category has associated purposes
    const purposeCount = existingCategory._count.purposes;
    if (purposeCount > 0) {
      throw new AppError("Cannot delete: This category has associated purposes", 400);
    }

    // Hard delete - permanently remove the category
    await prisma.purposeCategory.delete({ where: { purpose_category_id } });
    
    return {
      success: true,
      message: "Purpose category deleted successfully",
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets purpose category analytics summary.
 * 
 * @param {string} data_fiduciary_id - Data fiduciary ID to filter analytics.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryAnalyticsResponse>>} API response with analytics data.
 * @throws {Error} Throws an error if retrieving analytics fails.
 */
export const getPurposeCategoryAnalytics = async (
  data_fiduciary_id: string
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PurposeCategoryAnalyticsResponse>> => {
  try {
    const [
      totalCategories,
      totalActiveCategories,
      totalInactiveCategories,
      recentlyCreated,
      categoriesByStatus,
      topCategoriesByPurposes,
      newCategoriesTrend,
    ] = await Promise.all([
      // Total categories count for this fiduciary
      prisma.purposeCategory.count({
        where: { data_fiduciary_id },
      }),
      // Active categories count for this fiduciary
      prisma.purposeCategory.count({
        where: { data_fiduciary_id, is_active: true },
      }),
      // Inactive categories count for this fiduciary
      prisma.purposeCategory.count({
        where: { data_fiduciary_id, is_active: false },
      }),
      // Recently created categories for this fiduciary (last 30 days)
      prisma.purposeCategory.count({
        where: {
          data_fiduciary_id,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Categories by active status for this fiduciary
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN is_active = true THEN 'active'
            WHEN is_active = false THEN 'inactive'
            ELSE 'unknown'
          END as status,
          COUNT(*) as count
        FROM "purpose_categories"
        WHERE data_fiduciary_id = ${data_fiduciary_id}
        GROUP BY 
          CASE 
            WHEN is_active = true THEN 'active'
            WHEN is_active = false THEN 'inactive'
            ELSE 'unknown'
          END
      `,
      // Top categories by purpose count for this fiduciary
      prisma.purposeCategory.findMany({
        where: { data_fiduciary_id },
        include: {
          _count: {
            select: { purposes: true },
          },
        },
        orderBy: {
          purposes: {
            _count: "desc",
          },
        },
        take: 10,
      }),
      // New categories trend for this fiduciary (last 6 months, monthly breakdown)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count
        FROM "purpose_categories"
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND data_fiduciary_id = ${data_fiduciary_id}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `,
    ]);

    // Convert BigInt to Number for JSON serialization
    const convertedCategoriesByStatus = (categoriesByStatus as any[]).map((item) => ({
      status: item.status,
      count: Number(item.count),
    }));

    const convertedNewCategoriesTrend = (newCategoriesTrend as any[]).map((item) => ({
      month: item.month,
      count: Number(item.count),
    }));

    return {
      success: true,
      message: "Purpose category analytics retrieved successfully",
      data: {
        category_counts: {
          total_categories: totalCategories,
          active_categories: totalActiveCategories,
          inactive_categories: totalInactiveCategories,
          recently_created: recentlyCreated,
        },
        category_trends: {
          new_categories_by_month: convertedNewCategoriesTrend,
        },
        category_distributions: {
          categories_by_status: convertedCategoriesByStatus,
          top_categories_by_purposes: topCategoriesByPurposes.map(({ _count, ...cat }) => ({
            ...cat,
            total_purposes: _count.purposes,
          })),
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets analytics for purpose categories grouped by data fiduciary (global statistics).
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.GroupedCategoriesAnalyticsResponse>>} API response with analytics data.
 * @throws {Error} Throws an error if retrieving analytics fails.
 */
export const getGroupedCategoriesAnalytics = async (): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.GroupedCategoriesAnalyticsResponse>> => {
  try {
    // Get total number of fiduciaries
    const totalFiduciaries = await prisma.dataFiduciary.count();

    // Get total number of categories across all fiduciaries
    const totalCategories = await prisma.purposeCategory.count();

    // Get all fiduciaries with their category counts
    const fiduciaries = await prisma.dataFiduciary.findMany({
      select: {
        data_fiduciary_id: true,
        name: true,
      },
    });

    const fiduciaryIds = fiduciaries.map((f) => f.data_fiduciary_id);

    // Group categories by data_fiduciary_id and count
    const groupedCategories = await prisma.purposeCategory.groupBy({
      by: ["data_fiduciary_id"],
      where: {
        data_fiduciary_id: {
          in: fiduciaryIds,
        },
      },
      _count: {
        purpose_category_id: true,
      },
      orderBy: {
        _count: {
          purpose_category_id: "desc",
        },
      },
    });

    // Calculate statistics
    const fiduciariesWithCategories = groupedCategories.length;
    const fiduciariesWithoutCategories = totalFiduciaries - fiduciariesWithCategories;
    const averageCategoriesPerFiduciary = totalFiduciaries > 0 
      ? Math.round((totalCategories / totalFiduciaries) * 100) / 100 
      : 0;

    // Get top 10 fiduciaries by category count
    const topFiduciaries: PurposeCategoryTypes.PurposeCategoryGroupedByFiduciary[] = groupedCategories
      .slice(0, 10)
      .map((group) => {
        const fiduciary = fiduciaries.find((f) => f.data_fiduciary_id === group.data_fiduciary_id);
        return {
          data_fiduciary_id: group.data_fiduciary_id,
          data_fiduciary_name: fiduciary?.name || "Unknown",
          total_categories: group._count.purpose_category_id,
        };
      });

    return {
      success: true,
      message: "Grouped categories analytics retrieved successfully",
      data: {
        total_fiduciaries: totalFiduciaries,
        total_categories: totalCategories,
        average_categories_per_fiduciary: averageCategoriesPerFiduciary,
        fiduciaries_with_categories: fiduciariesWithCategories,
        fiduciaries_without_categories: fiduciariesWithoutCategories,
        top_fiduciaries_by_categories: topFiduciaries,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Gets all purpose categories grouped by data fiduciary with counts.
 * 
 * @param {number} page - Page number (default: 1).
 * @param {number} limit - Items per page (default: 10).
 * @param {string} [q] - Search query to filter by fiduciary name.
 * 
 * @returns {Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PaginatedGroupedByFiduciaryResponse>>} API response with grouped categories and pagination.
 * @throws {AppError} Throws an error if query fails.
 */
export const getPurposeCategoriesGroupedByFiduciary = async (
  page: number = 1,
  limit: number = 10,
  q?: string
): Promise<PurposeCategoryTypes.ApiResponse<PurposeCategoryTypes.PaginatedGroupedByFiduciaryResponse>> => {
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

    // Group categories by data_fiduciary_id and count for the filtered fiduciaries
    const groupedCategories = await prisma.purposeCategory.groupBy({
      by: ["data_fiduciary_id"],
      where: {
        data_fiduciary_id: {
          in: fiduciaryIds,
        },
      },
      _count: {
        purpose_category_id: true,
      },
    });

    // Combine grouped data with fiduciary names
    const result: PurposeCategoryTypes.PurposeCategoryGroupedByFiduciary[] =
      fiduciaries.map((fiduciary) => {
        const group = groupedCategories.find(
          (g) => g.data_fiduciary_id === fiduciary.data_fiduciary_id
        );
        return {
          data_fiduciary_id: fiduciary.data_fiduciary_id,
          data_fiduciary_name: fiduciary.name,
          total_categories: group?._count.purpose_category_id || 0,
        };
      });

    return {
      success: true,
      message: "Purpose categories grouped by data fiduciary retrieved successfully",
      data: {
        data: result,
        meta: {
          pagination: {
            total_categories: totalFiduciaries,
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
 * Retrieves all purposes for a specific category with pagination, search, and filtering.
 * 
 * @param data_fiduciary_id - Data fiduciary ID to filter purposes.
 * @param purpose_category_id - Purpose category ID to filter purposes.
 * @param page - Page number for pagination (default is 1).
 * @param limit - Number of items per page (default is 10).
 * @param q - Search term for filtering by title or description.
 * @param is_active - Filter by active status.
 * @param is_mandatory - Filter by mandatory status.
 * @param requires_renewal - Filter by renewal requirement.
 * @param sort_by - Field to sort by (default: 'display_order').
 * @param sort_order - Sort order (default: 'asc').
 * 
 * @returns API response with paginated list of purposes.
 */
export const getAllPurposesByCategory = async (
  data_fiduciary_id: string,
  purpose_category_id: string,
  page: number = 1,
  limit: number = 10,
  q?: string,
  is_active?: boolean,
  is_mandatory?: boolean,
  requires_renewal?: boolean,
  sort_by: string = "display_order",
  sort_order: "asc" | "desc" = "asc"
): Promise<any> => {
  try {
    const skip = (page - 1) * limit;

    // Verify that the category exists and belongs to the fiduciary
    const category = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
    });

    if (!category) {
      throw new AppError("Purpose category not found", 404);
    }

    if (category.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Purpose category does not belong to this data fiduciary", 403);
    }

    // Build where clause
    const where: any = {
      data_fiduciary_id,
      purpose_category_id,
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
          category: {
            purpose_category_id: category.purpose_category_id,
            name: category.name,
          },
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
 * Retrieves analytics for purposes in a specific category.
 * 
 * @param data_fiduciary_id - Data fiduciary ID.
 * @param purpose_category_id - Purpose category ID.
 * 
 * @returns API response with analytics data for purposes in the category.
 */
export const getPurposesCategoryAnalytics = async (
  data_fiduciary_id: string,
  purpose_category_id: string
): Promise<any> => {
  try {
    // Verify that the category exists and belongs to the fiduciary
    const category = await prisma.purposeCategory.findUnique({
      where: { purpose_category_id },
      select: {
        purpose_category_id: true,
        name: true,
        description: true,
        data_fiduciary_id: true,
        is_active: true,
      },
    });

    if (!category) {
      throw new AppError("Purpose category not found", 404);
    }

    if (category.data_fiduciary_id !== data_fiduciary_id) {
      throw new AppError("Purpose category does not belong to this data fiduciary", 403);
    }

    // Base filter for purposes in this category
    const baseFilter = {
      data_fiduciary_id,
      purpose_category_id,
    };

    const [
      totalPurposes,
      activePurposes,
      inactivePurposes,
      mandatoryPurposes,
      optionalPurposes,
      purposesWithRenewal,
      recentlyCreated,
      topPurposesByVersions,
    ] = await Promise.all([
      // Total purposes in category
      prisma.purpose.count({ where: baseFilter }),
      
      // Active purposes
      prisma.purpose.count({
        where: { ...baseFilter, is_active: true },
      }),
      
      // Inactive purposes
      prisma.purpose.count({
        where: { ...baseFilter, is_active: false },
      }),
      
      // Mandatory purposes
      prisma.purpose.count({
        where: { ...baseFilter, is_mandatory: true },
      }),
      
      // Optional purposes
      prisma.purpose.count({
        where: { ...baseFilter, is_mandatory: false },
      }),
      
      // Purposes requiring renewal
      prisma.purpose.count({
        where: { ...baseFilter, requires_renewal: true },
      }),
      
      // Recently created (last 30 days)
      prisma.purpose.count({
        where: {
          ...baseFilter,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Top purposes by version count
      prisma.purpose.findMany({
        where: baseFilter,
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
    ]);

    return {
      success: true,
      message: "Purpose category analytics retrieved successfully",
      data: {
        category_info: {
          purpose_category_id: category.purpose_category_id,
          name: category.name,
          description: category.description,
          is_active: category.is_active,
        },
        purpose_counts: {
          total_purposes: totalPurposes,
          active_purposes: activePurposes,
          inactive_purposes: inactivePurposes,
          mandatory_purposes: mandatoryPurposes,
          optional_purposes: optionalPurposes,
          purposes_with_renewal: purposesWithRenewal,
          recently_created: recentlyCreated,
        },
        top_purposes_by_versions: topPurposesByVersions.map(({ _count, ...p }) => ({
          ...p,
          total_versions: _count.purpose_version,
          total_translations: _count.translations,
        })),
      },
    };
  } catch (error) {
    throw error;
  }
};