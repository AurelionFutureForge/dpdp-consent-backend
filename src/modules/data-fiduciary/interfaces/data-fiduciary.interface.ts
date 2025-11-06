/**
 * @fileoverview TypeScript interfaces for data-fiduciary module.
 * @module modules/data-fiduciary/interfaces
 */

/**
 * Interface for data fiduciary registration request payload.
 * 
 * @interface RegisterDataFiduciaryRequest
 * @property {string} name - Display name of the data fiduciary.
 * @property {string} legal_name - Legal registered name.
 * @property {string} [registration_number] - Optional registration number.
 * @property {string} contact_email - Primary contact email.
 * @property {string} [contact_phone] - Optional contact phone number.
 * @property {string} [dpo_email] - Data Protection Officer email.
 * @property {string} [dpo_phone] - Data Protection Officer phone.
 * @property {string} [website_url] - Company website URL.
 * @property {number} [rate_limit_per_min] - API rate limit per minute (default: 1000).
 * @property {number} [rate_limit_per_day] - API rate limit per day (default: 100000).
 * @property {string} [logo_url] - Logo URL for branding.
 * @property {string} [privacy_policy_url] - Privacy policy URL.
 * @property {string} [terms_url] - Terms of service URL.
 * @property {boolean} [gdpr_compliant] - GDPR compliance flag.
 * @property {boolean} [dpdp_compliant] - DPDP Act compliance flag.
 */
export interface RegisterDataFiduciaryRequest {
  name: string;
  legal_name: string;
  registration_number?: string;
  contact_email: string;
  contact_phone?: string;
  dpo_email?: string;
  dpo_phone?: string;
  website_url?: string;
  rate_limit_per_min?: number;
  rate_limit_per_day?: number;
  logo_url?: string;
  privacy_policy_url?: string;
  terms_url?: string;
  gdpr_compliant?: boolean;
  dpdp_compliant?: boolean;
}

/**
 * Interface for data fiduciary registration response.
 * 
 * @interface RegisterDataFiduciaryResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the registration was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Data fiduciary data object or null if registration failed.
 * @property {string} data.data_fiduciary_id - Unique identifier for the data fiduciary.
 * @property {string} data.name - Display name.
 * @property {string} data.legal_name - Legal name.
 * @property {string} data.contact_email - Contact email.
 * @property {Object} data.api_credentials - API credentials for authentication.
 * @property {string} data.api_credentials.api_key - API key for authentication.
 * @property {string} data.api_credentials.api_secret - API secret (plain text, only shown once).
 */
export interface RegisterDataFiduciaryResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    name: string;
    legal_name: string;
    contact_email: string;
    registration_number?: string;
    api_credentials: {
      api_key: string;
      api_secret: string; // Plain text secret, only returned during registration
    };
    rate_limit_per_min: number;
    rate_limit_per_day: number;
    is_active: boolean;
    created_at: Date;
  } | null;
}

/**
 * Interface for creating webhook configuration request.
 * 
 * @interface CreateWebhookRequest
 * @property {string} data_fiduciary_id - ID of the data fiduciary.
 * @property {string} webhook_url - Webhook endpoint URL.
 * @property {string} [webhook_secret] - Secret for webhook signature verification.
 * @property {string} [callback_url] - Callback URL for async operations.
 */
export interface CreateWebhookRequest {
  data_fiduciary_id: string;
  webhook_url: string;
  webhook_secret?: string;
  callback_url?: string;
}

/**
 * Interface for webhook configuration response.
 * 
 * @interface WebhookResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Webhook data or null if failed.
 */
export interface WebhookResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    webhook_url: string;
    callback_url?: string;
    updated_at: Date;
  } | null;
}

/**
 * Interface for get webhooks response.
 * 
 * @interface GetWebhooksResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Webhook configuration or null if not found.
 */
export interface GetWebhooksResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    name: string;
    webhook_url?: string;
    callback_url?: string;
    is_active: boolean;
    last_api_call?: Date;
    updated_at: Date;
  } | null;
}

/**
 * Interface for webhook log entry.
 * 
 * @interface WebhookLogEntry
 * @property {string} webhook_log_id - Unique identifier for the webhook log.
 * @property {string} event_type - Type of event that triggered the webhook.
 * @property {string} webhook_url - URL where the webhook was sent.
 * @property {string} method - HTTP method used.
 * @property {number} [status_code] - HTTP status code received.
 * @property {number} [response_time_ms] - Response time in milliseconds.
 * @property {boolean} success - Whether the webhook delivery was successful.
 * @property {string} [error_message] - Error message if failed.
 * @property {Date} created_at - When the webhook was sent.
 */
export interface WebhookLogEntry {
  webhook_log_id: string;
  event_type: string;
  webhook_url: string;
  method: string;
  status_code?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: Date;
}

/**
 * Interface for get webhook logs response.
 * 
 * @interface GetWebhookLogsResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Webhook logs data or null if failed.
 */
export interface GetWebhookLogsResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    total_logs: number;
    logs: WebhookLogEntry[];
  } | null;
}

/**
 * Interface for get data fiduciary profile response.
 * 
 * @interface GetDataFiduciaryProfileResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Data fiduciary profile data or null if not found.
 */
export interface GetDataFiduciaryProfileResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    name: string;
    legal_name: string;
    registration_number?: string;
    
    // Contact Information
    contact_email: string;
    contact_phone?: string;
    dpo_email?: string;
    dpo_phone?: string;
    website_url?: string;
    
    // API Configuration
    api_key: string;
    webhook_url?: string;
    callback_url?: string;
    
    // Rate Limiting
    rate_limit_per_min: number;
    rate_limit_per_day: number;
    
    // Settings & Status
    is_public: boolean;
    is_active: boolean;
    is_deleted: boolean;
    
    // Branding
    logo_url?: string;
    
    // Compliance
    privacy_policy_url?: string;
    terms_url?: string;
    gdpr_compliant: boolean;
    dpdp_compliant: boolean;
    
    // Timestamps
    created_at: Date;
    updated_at: Date;
    last_api_call?: Date;
  } | null;
}

/**
 * Interface for approving a data fiduciary request.
 * 
 * @interface ApproveDataFiduciaryRequest
 * @property {string} data_fiduciary_id - ID of the data fiduciary to approve.
 * @property {string} approved_by_user_id - User ID of the admin approving the fiduciary.
 * @property {string} [approval_notes] - Optional notes from the admin during approval.
 */
export interface ApproveDataFiduciaryRequest {
  data_fiduciary_id: string;
  approved_by_user_id: string;
  approval_notes?: string;
}

/**
 * Interface for data fiduciary approval response.
 * 
 * @interface ApproveDataFiduciaryResponse
 * @property {number} status - HTTP status code.
 * @property {boolean} success - Indicates if the approval was successful.
 * @property {string} message - Human-readable response message.
 * @property {Object|null} data - Approval data or null if failed.
 */
export interface ApproveDataFiduciaryResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    data_fiduciary_id: string;
    name: string;
    legal_name: string;
    contact_email: string;
    is_active: boolean;
    activated_by: string;
    activated_at: Date;
    approved_submissions_count: number;
    updated_at: Date;
  } | null;
}

/**
 * Interface for data fiduciary in review list item.
 * 
 * @interface DataFiduciaryInReview
 * @property {string} data_fiduciary_id - Unique identifier for the data fiduciary.
 * @property {string} name - Display name of the data fiduciary.
 * @property {string} legal_name - Legal registered name.
 * @property {string} [registration_number] - Registration number if provided.
 * @property {string} contact_email - Primary contact email.
 * @property {string} [contact_phone] - Optional contact phone number.
 * @property {string} [website_url] - Company website URL.
 * @property {boolean} is_active - Active status (should be false for review).
 * @property {boolean} dpdp_compliant - DPDP Act compliance flag.
 * @property {boolean} gdpr_compliant - GDPR compliance flag.
 * @property {number} total_platform_submissions - Count of associated platform submissions.
 * @property {Date} created_at - Registration timestamp.
 */
export interface DataFiduciaryInReview {
  data_fiduciary_id: string;
  name: string;
  legal_name: string;
  registration_number?: string;
  contact_email: string;
  contact_phone?: string;
  website_url?: string;
  is_active: boolean;
  dpdp_compliant: boolean;
  gdpr_compliant: boolean;
  total_platform_submissions: number;
  created_at: Date;
}

/**
 * Interface for paginated data fiduciary in review response.
 * 
 * @interface PaginatedDataFiduciaryInReviewResponse
 * @property {DataFiduciaryInReview[]} data - Array of data fiduciaries in review.
 * @property {Object} meta - Metadata including pagination information.
 */
export interface PaginatedDataFiduciaryInReviewResponse {
  data: DataFiduciaryInReview[];
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
 * Interface for API response wrapper.
 * 
 * @interface ApiResponse
 * @property {boolean} success - Indicates if the operation was successful.
 * @property {string} message - Human-readable response message.
 * @property {T | null} data - Response data or null if failed.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Interface for data fiduciary in review analytics.
 * 
 * @interface DataFiduciaryInReviewAnalytics
 * @property {number} total_in_review - Total count of data fiduciaries in review.
 * @property {number} total_pending_approval - Count of fiduciaries awaiting approval.
 * @property {Object} by_compliance - Breakdown by compliance status.
 * @property {Object} recent_submissions - Recent submission statistics.
 */
export interface DataFiduciaryInReviewAnalytics {
  total_in_review: number;
  total_pending_approval: number;
  by_compliance: {
    dpdp_compliant: number;
    gdpr_compliant: number;
    both_compliant: number;
    none_compliant: number;
  };
  recent_submissions: {
    last_7_days: number;
    last_30_days: number;
    last_90_days: number;
  };
  oldest_pending: {
    data_fiduciary_id: string;
    name: string;
    days_pending: number;
    created_at: Date;
  } | null;
}

