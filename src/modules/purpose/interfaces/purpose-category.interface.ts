/**
 * @fileoverview TypeScript interfaces for Purpose Category module.
 * @module modules/purpose/interfaces
 */

/**
 * Interface for purpose category creation data.
 * 
 * @interface CreatePurposeCategoryInput
 * @property {string} data_fiduciary_id - Data fiduciary ID (owner).
 * @property {string} name - Category name (unique per fiduciary).
 * @property {string} [description] - Optional category description.
 * @property {number} [display_order] - Display order for sorting (default: 0).
 * @property {boolean} [is_active] - Active status (default: true).
 */
export interface CreatePurposeCategoryInput {
  data_fiduciary_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Interface for purpose category update data.
 * 
 * @interface UpdatePurposeCategoryInput
 * @property {string} [name] - Category name (unique).
 * @property {string | null} [description] - Category description (nullable).
 * @property {number} [display_order] - Display order for sorting.
 * @property {boolean} [is_active] - Active status.
 */
export interface UpdatePurposeCategoryInput {
  name?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Interface for purpose category response with purpose count.
 * 
 * @interface PurposeCategoryWithCount
 * @property {string} purpose_category_id - Unique identifier.
 * @property {string} data_fiduciary_id - Data fiduciary ID (owner).
 * @property {string} name - Category name.
 * @property {string | null} description - Category description.
 * @property {number} display_order - Display order.
 * @property {boolean} is_active - Active status.
 * @property {Date} created_at - Creation timestamp.
 * @property {Date} updated_at - Last update timestamp.
 * @property {number} total_purposes - Count of associated purposes.
 */
export interface PurposeCategoryWithCount {
  purpose_category_id: string;
  data_fiduciary_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  total_purposes: number;
}

/**
 * Interface for paginated purpose category response.
 * 
 * @interface PaginatedPurposeCategoryResponse
 * @property {PurposeCategoryWithCount[]} data - Array of purpose categories.
 * @property {Object} meta - Metadata for pagination.
 * @property {Object} meta.pagination - Pagination information.
 * @property {number} meta.pagination.total_categories - Total count of categories.
 * @property {number} meta.pagination.limit - Items per page.
 * @property {number} meta.pagination.current_page - Current page number.
 * @property {number} meta.pagination.total_pages - Total number of pages.
 */
export interface PaginatedPurposeCategoryResponse {
  data: PurposeCategoryWithCount[];
  meta: {
    pagination: {
      total_categories: number;
      limit: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Interface for purpose category analytics response.
 * 
 * @interface PurposeCategoryAnalyticsResponse
 * @property {Object} category_counts - Category count statistics.
 * @property {number} category_counts.total_categories - Total categories.
 * @property {number} category_counts.active_categories - Active categories.
 * @property {number} category_counts.inactive_categories - Inactive categories.
 * @property {number} category_counts.recently_created - Recently created (last 30 days).
 * @property {Object} category_trends - Category trend data.
 * @property {Array} category_trends.new_categories_by_month - Monthly creation trend.
 * @property {Object} category_distributions - Category distribution data.
 * @property {Array} category_distributions.categories_by_status - Categories grouped by status.
 * @property {PurposeCategoryWithCount[]} category_distributions.top_categories_by_purposes - Top categories by purpose count.
 */
export interface PurposeCategoryAnalyticsResponse {
  category_counts: {
    total_categories: number;
    active_categories: number;
    inactive_categories: number;
    recently_created: number;
  };
  category_trends: {
    new_categories_by_month: any[];
  };
  category_distributions: {
    categories_by_status: any[];
    top_categories_by_purposes: PurposeCategoryWithCount[];
  };
}

/**
 * Interface for purpose category mini summary response (lightweight version).
 * 
 * @interface PurposeCategoryMiniSummaryResponse
 * @property {number} total_categories - Total categories count.
 * @property {number} active_categories - Active categories count.
 * @property {number} inactive_categories - Inactive categories count.
 * @property {number} recently_created - Recently created count (last 30 days).
 */
export interface PurposeCategoryMiniSummaryResponse {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  recently_created: number;
}

/**
 * Interface for toggle status response.
 * 
 * @interface ToggleStatusResponse
 * @property {string} message - Response message.
 * @property {PurposeCategoryWithCount} data - Updated category data.
 */
export interface ToggleStatusResponse {
  message: string;
  data: PurposeCategoryWithCount;
}

/**
 * Interface for delete response.
 * 
 * @interface DeleteResponse
 * @property {string} message - Response message.
 * @property {null} data - Null data for delete operation.
 */
export interface DeleteResponse {
  message: string;
  data: null;
}

/**
 * Interface for reorder categories input.
 * 
 * @interface ReorderCategoriesInput
 * @property {Array} categories - Array of category ID and display order pairs.
 * @property {string} categories[].purpose_category_id - Category ID.
 * @property {number} categories[].display_order - New display order.
 */
export interface ReorderCategoriesInput {
  categories: {
    purpose_category_id: string;
    display_order: number;
  }[];
}

/**
 * Interface for purpose categories grouped by data fiduciary.
 * 
 * @interface PurposeCategoryGroupedByFiduciary
 * @property {string} data_fiduciary_id - Data fiduciary ID.
 * @property {string} data_fiduciary_name - Data fiduciary name.
 * @property {number} total_categories - Total number of purpose categories for this fiduciary.
 */
export interface PurposeCategoryGroupedByFiduciary {
  data_fiduciary_id: string;
  data_fiduciary_name: string;
  total_categories: number;
}

/**
 * Interface for paginated purpose categories grouped by data fiduciary response.
 * 
 * @interface PaginatedGroupedByFiduciaryResponse
 * @property {PurposeCategoryGroupedByFiduciary[]} data - Array of grouped categories.
 * @property {Object} meta - Metadata for pagination.
 * @property {Object} meta.pagination - Pagination information.
 * @property {number} meta.pagination.total_categories - Total count of fiduciaries (matching search).
 * @property {number} meta.pagination.limit - Items per page.
 * @property {number} meta.pagination.current_page - Current page number.
 * @property {number} meta.pagination.total_pages - Total number of pages.
 */
export interface PaginatedGroupedByFiduciaryResponse {
  data: PurposeCategoryGroupedByFiduciary[];
  meta: {
    pagination: {
      total_categories: number;
      limit: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Interface for grouped categories analytics response (global analytics across all fiduciaries).
 * 
 * @interface GroupedCategoriesAnalyticsResponse
 * @property {number} total_fiduciaries - Total number of data fiduciaries.
 * @property {number} total_categories - Total number of purpose categories across all fiduciaries.
 * @property {number} average_categories_per_fiduciary - Average number of categories per fiduciary.
 * @property {number} fiduciaries_with_categories - Number of fiduciaries that have at least one category.
 * @property {number} fiduciaries_without_categories - Number of fiduciaries with zero categories.
 * @property {PurposeCategoryGroupedByFiduciary[]} top_fiduciaries_by_categories - Top 10 fiduciaries by category count.
 */
export interface GroupedCategoriesAnalyticsResponse {
  total_fiduciaries: number;
  total_categories: number;
  average_categories_per_fiduciary: number;
  fiduciaries_with_categories: number;
  fiduciaries_without_categories: number;
  top_fiduciaries_by_categories: PurposeCategoryGroupedByFiduciary[];
}

/**
 * Standard API response interface for purpose category operations.
 * 
 * @interface ApiResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {T} data - Response data (generic type).
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

