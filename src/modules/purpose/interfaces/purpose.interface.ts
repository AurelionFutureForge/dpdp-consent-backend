/**
 * @fileoverview TypeScript interfaces for Purpose module.
 * @module modules/purpose/interfaces
 */

/**
 * Interface for purpose creation data.
 * 
 * @interface CreatePurposeInput
 * @property {string} data_fiduciary_id - Data fiduciary ID (owner).
 * @property {string} [purpose_category_id] - Optional purpose category ID.
 * @property {string} title - Purpose title.
 * @property {string} [description] - Optional purpose description.
 * @property {string} [legal_basis] - Legal basis reference (DPDP Act).
 * @property {string[]} data_fields - Array of data fields collected.
 * @property {string[]} processing_activities - Array of processing activities.
 * @property {number} [retention_period_days] - Retention period in days.
 * @property {boolean} [is_mandatory] - Whether consent is mandatory (default: false).
 * @property {boolean} [is_active] - Active status (default: true).
 * @property {boolean} [requires_renewal] - Whether requires renewal (default: false).
 * @property {number} [renewal_period_days] - Renewal period in days.
 * @property {number} [display_order] - Display order for sorting (default: 0).
 */
export interface CreatePurposeInput {
  data_fiduciary_id: string;
  purpose_category_id?: string;
  title: string;
  description?: string;
  legal_basis?: string;
  data_fields: string[];
  processing_activities: string[];
  retention_period_days?: number;
  is_mandatory?: boolean;
  is_active?: boolean;
  requires_renewal?: boolean;
  renewal_period_days?: number;
  display_order?: number;
}

/**
 * Interface for purpose update data.
 * 
 * @interface UpdatePurposeInput
 * @property {string} [purpose_category_id] - Purpose category ID (nullable).
 * @property {string} [title] - Purpose title.
 * @property {string | null} [description] - Purpose description (nullable).
 * @property {string | null} [legal_basis] - Legal basis reference (nullable).
 * @property {string[]} [data_fields] - Array of data fields.
 * @property {string[]} [processing_activities] - Array of processing activities.
 * @property {number | null} [retention_period_days] - Retention period in days (nullable).
 * @property {boolean} [is_mandatory] - Whether consent is mandatory.
 * @property {boolean} [is_active] - Active status.
 * @property {boolean} [requires_renewal] - Whether requires renewal.
 * @property {number | null} [renewal_period_days] - Renewal period in days (nullable).
 * @property {number} [display_order] - Display order for sorting.
 */
export interface UpdatePurposeInput {
  purpose_category_id?: string | null;
  title?: string;
  description?: string | null;
  legal_basis?: string | null;
  data_fields?: string[];
  processing_activities?: string[];
  retention_period_days?: number | null;
  is_mandatory?: boolean;
  is_active?: boolean;
  requires_renewal?: boolean;
  renewal_period_days?: number | null;
  display_order?: number;
}

/**
 * Interface for purpose response with category and version counts.
 * 
 * @interface PurposeWithCounts
 * @property {string} purpose_id - Unique identifier.
 * @property {string} data_fiduciary_id - Data fiduciary ID (owner).
 * @property {string | null} purpose_category_id - Purpose category ID.
 * @property {string} title - Purpose title.
 * @property {string | null} description - Purpose description.
 * @property {string | null} legal_basis - Legal basis reference.
 * @property {string[]} data_fields - Array of data fields.
 * @property {string[]} processing_activities - Array of processing activities.
 * @property {number | null} retention_period_days - Retention period in days.
 * @property {boolean} is_mandatory - Whether consent is mandatory.
 * @property {boolean} is_active - Active status.
 * @property {boolean} requires_renewal - Whether requires renewal.
 * @property {number | null} renewal_period_days - Renewal period in days.
 * @property {number} display_order - Display order.
 * @property {Date} created_at - Creation timestamp.
 * @property {Date} updated_at - Last update timestamp.
 * @property {number} total_versions - Count of purpose versions.
 * @property {number} total_translations - Count of purpose translations.
 * @property {Object | null} category - Category information (if exists).
 */
export interface PurposeWithCounts {
  purpose_id: string;
  data_fiduciary_id: string;
  purpose_category_id: string | null;
  title: string;
  description: string | null;
  legal_basis: string | null;
  data_fields: string[];
  processing_activities: string[];
  retention_period_days: number | null;
  is_mandatory: boolean;
  is_active: boolean;
  requires_renewal: boolean;
  renewal_period_days: number | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  total_versions: number;
  total_translations: number;
  category?: {
    purpose_category_id: string;
    name: string;
  } | null;
}

/**
 * Interface for paginated purpose response.
 * 
 * @interface PaginatedPurposeResponse
 * @property {PurposeWithCounts[]} data - Array of purposes.
 * @property {Object} meta - Metadata for pagination.
 * @property {Object} meta.pagination - Pagination information.
 * @property {number} meta.pagination.total_purposes - Total count of purposes.
 * @property {number} meta.pagination.limit - Items per page.
 * @property {number} meta.pagination.current_page - Current page number.
 * @property {number} meta.pagination.total_pages - Total number of pages.
 */
export interface PaginatedPurposeResponse {
  data: PurposeWithCounts[];
  meta: {
    pagination: {
      total_purposes: number;
      limit: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Interface for purpose analytics response.
 * 
 * @interface PurposeAnalyticsResponse
 * @property {Object} purpose_counts - Purpose count statistics.
 * @property {number} purpose_counts.total_purposes - Total purposes.
 * @property {number} purpose_counts.active_purposes - Active purposes.
 * @property {number} purpose_counts.inactive_purposes - Inactive purposes.
 * @property {number} purpose_counts.mandatory_purposes - Mandatory purposes.
 * @property {number} purpose_counts.optional_purposes - Optional purposes.
 * @property {number} purpose_counts.recently_created - Recently created (last 30 days).
 * @property {Object} purpose_trends - Purpose trend data.
 * @property {Array} purpose_trends.new_purposes_by_month - Monthly creation trend.
 * @property {Object} purpose_distributions - Purpose distribution data.
 * @property {Array} purpose_distributions.purposes_by_status - Purposes grouped by status.
 * @property {Array} purpose_distributions.purposes_by_category - Purposes grouped by category.
 * @property {PurposeWithCounts[]} purpose_distributions.top_purposes_by_versions - Top purposes by version count.
 */
export interface PurposeAnalyticsResponse {
  purpose_counts: {
    total_purposes: number;
    active_purposes: number;
    inactive_purposes: number;
    mandatory_purposes: number;
    optional_purposes: number;
    recently_created: number;
  };
  purpose_trends: {
    new_purposes_by_month: any[];
  };
  purpose_distributions: {
    purposes_by_status: any[];
    purposes_by_category: any[];
    top_purposes_by_versions: PurposeWithCounts[];
  };
}

/**
 * Interface for purposes grouped by category.
 * 
 * @interface PurposeGroupedByCategory
 * @property {string | null} purpose_category_id - Purpose category ID (null for uncategorized).
 * @property {string | null} purpose_category_name - Purpose category name (null for uncategorized).
 * @property {number} total_purposes - Total number of purposes in this category.
 */
export interface PurposeGroupedByCategory {
  purpose_category_id: string | null;
  purpose_category_name: string | null;
  total_purposes: number;
}

/**
 * Interface for paginated purposes grouped by category response.
 * 
 * @interface PaginatedGroupedByCategoryResponse
 * @property {PurposeGroupedByCategory[]} data - Array of grouped purposes.
 * @property {Object} meta - Metadata for pagination.
 * @property {Object} meta.pagination - Pagination information.
 * @property {number} meta.pagination.total_categories - Total count of categories.
 * @property {number} meta.pagination.limit - Items per page.
 * @property {number} meta.pagination.current_page - Current page number.
 * @property {number} meta.pagination.total_pages - Total number of pages.
 */
export interface PaginatedGroupedByCategoryResponse {
  data: PurposeGroupedByCategory[];
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
 * Interface for purposes grouped by data fiduciary.
 * 
 * @interface PurposeGroupedByFiduciary
 * @property {string} data_fiduciary_id - Data fiduciary ID.
 * @property {string} data_fiduciary_name - Data fiduciary name.
 * @property {number} total_purposes - Total number of purposes for this fiduciary.
 */
export interface PurposeGroupedByFiduciary {
  data_fiduciary_id: string;
  data_fiduciary_name: string;
  total_purposes: number;
}

/**
 * Interface for paginated purposes grouped by fiduciary response.
 * 
 * @interface PaginatedGroupedByFiduciaryResponse
 * @property {PurposeGroupedByFiduciary[]} data - Array of grouped purposes.
 * @property {Object} meta - Metadata for pagination.
 * @property {Object} meta.pagination - Pagination information.
 * @property {number} meta.pagination.total_fiduciaries - Total count of fiduciaries.
 * @property {number} meta.pagination.limit - Items per page.
 * @property {number} meta.pagination.current_page - Current page number.
 * @property {number} meta.pagination.total_pages - Total number of pages.
 */
export interface PaginatedGroupedByFiduciaryResponse {
  data: PurposeGroupedByFiduciary[];
  meta: {
    pagination: {
      total_fiduciaries: number;
      limit: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Interface for grouped purposes analytics response (global analytics across all fiduciaries).
 * 
 * @interface GroupedPurposesAnalyticsResponse
 * @property {number} total_fiduciaries - Total number of data fiduciaries.
 * @property {number} total_purposes - Total number of purposes across all fiduciaries.
 * @property {number} average_purposes_per_fiduciary - Average number of purposes per fiduciary.
 * @property {number} fiduciaries_with_purposes - Number of fiduciaries that have at least one purpose.
 * @property {number} fiduciaries_without_purposes - Number of fiduciaries with zero purposes.
 * @property {PurposeGroupedByFiduciary[]} top_fiduciaries_by_purposes - Top 10 fiduciaries by purpose count.
 */
export interface GroupedPurposesAnalyticsResponse {
  total_fiduciaries: number;
  total_purposes: number;
  average_purposes_per_fiduciary: number;
  fiduciaries_with_purposes: number;
  fiduciaries_without_purposes: number;
  top_fiduciaries_by_purposes: PurposeGroupedByFiduciary[];
}

/**
 * Standard API response interface for purpose operations.
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

