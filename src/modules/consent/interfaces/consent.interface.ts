/**
 * @fileoverview TypeScript interfaces for Consent Collection module.
 * @module modules/consent/interfaces
 */

/**
 * Interface for initiating a consent request (Step 1 in diagram)
 */
export interface InitiateConsentInput {
  data_fiduciary_id: string;
  user_id: string; // External user ID from fiduciary's system
  purposes: string[]; // Array of purpose IDs
  data_fields?: string[]; // Optional: specific data fields being collected
  duration?: number; // Optional: custom duration in days
  metadata?: Record<string, any>; // Additional context
  language?: string; // Preferred language for consent notice
  redirect_url?: string; // URL to redirect user after consent submission
  email?: string; // Optional: user email to be added to user_details
  phone?: string; // Optional: user phone to be added to user_details
}

/**
 * Response when consent request is initiated
 */
export interface InitiateConsentResponse {
  cms_request_id: string; // Consent request ID
  notice_url: string; // URL to redirect user to consent notice page
  status: 'INITIATED';
  expires_at: Date; // When this consent request expires
  redirect_url?: string; // Stored redirect URL (echoed back)
}

/**
 * Interface for consent notice data (Step 5-7 in diagram)
 */
export interface ConsentNoticeData {
  cms_request_id: string;
  data_fiduciary: {
    data_fiduciary_id: string;
    name: string;
    legal_name: string;
    logo_url?: string;
    contact_email: string;
    website_url?: string;
    privacy_policy_url?: string;
  };
  purposes_by_category: PurposeCategoryGroup[]; // Grouped by category
  retention_policy: {
    retention_period_days: number;
    withdrawal_policy: string;
  };
  language_config: {
    language_code: string;
    translations: Record<string, string>;
  };
  valid_until: Date;
  mandatory_purposes: string[]; // Purpose IDs that are mandatory
  redirect_url?: string; // URL to redirect user after consent submission
}

/**
 * Purpose category group for consent notice
 */
export interface PurposeCategoryGroup {
  category_id: string | null; // null for uncategorized
  category_name: string | null; // null for uncategorized
  purposes: ConsentPurposeDetail[];
}

/**
 * Detailed purpose information for consent notice
 */
export interface ConsentPurposeDetail {
  purpose_id: string;
  purpose_version_id: string;
  version_number: number;
  title: string;
  description: string;
  legal_basis: string;
  data_fields: string[];
  processing_activities: string[];
  retention_period_days: number;
  is_mandatory: boolean;
  category?: {
    purpose_category_id: string;
    name: string;
  };
}

/**
 * Interface for submitting consent (Step 8 in diagram)
 */
export interface SubmitConsentInput {
  cms_request_id: string;
  selected_purposes: string[]; // Array of purpose IDs user agreed to
  agree: boolean; // Overall agreement
  language_code?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Response after consent submission
 */
export interface SubmitConsentResponse {
  artifact_id: string; // Consent artifact ID
  status: 'ACTIVE';
  valid_till: Date;
  purposes: ConsentArtifactPurpose[];
  hash: string; // SHA256 hash of consent artifact
  redirect_url?: string; // URL to redirect user to (with consent status)
  redirect_params?: { // Query parameters to append to redirect URL
    consent_id: string;
    status: string;
    timestamp: string;
  };
}

/**
 * Purpose details in consent artifact
 */
export interface ConsentArtifactPurpose {
  purpose_id: string;
  purpose_version_id: string;
  title: string;
  granted_at: Date;
}

/**
 * Webhook payload sent to data fiduciary (Step 12 in diagram)
 */
export interface ConsentWebhookPayload {
  event_type: 'consent.granted' | 'consent.updated' | 'consent.withdrawn' | 'consent.expired';
  artifact_id: string;
  data_fiduciary_id: string;
  user_id: string; // External user ID
  purposes: {
    purpose_id: string;
    purpose_version_id: string;
    title: string;
  }[];
  status: 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';
  valid_till: Date | null;
  granted_at: Date;
  updated_at?: Date;
  withdrawn_at?: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for validating consent artifact (Step 16-18 in diagram)
 */
export interface ValidateConsentInput {
  artifact_id: string;
  data_fiduciary_id: string;
  purpose_id?: string; // Optional: validate specific purpose
}

/**
 * Response for consent validation
 */
export interface ValidateConsentResponse {
  is_valid: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'WITHDRAWN' | 'NOT_FOUND';
  artifact_id: string;
  data_principal_id?: string;
  purposes?: {
    purpose_id: string;
    purpose_version_id: string;
    title: string;
    is_valid: boolean;
  }[];
  valid_till?: Date;
  withdrawn_at?: Date;
  expires_at?: Date;
  message: string;
}

/**
 * Interface for consent request stored in database
 */
export interface ConsentRequest {
  consent_request_id: string;
  data_fiduciary_id: string;
  external_user_id: string;
  status: 'INITIATED' | 'VIEWED' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';
  purposes: string[]; // JSON array of purpose IDs
  data_fields?: string[];
  duration?: number;
  metadata?: Record<string, any>;
  language?: string;
  redirect_url?: string; // URL to redirect after consent
  requested_at: Date;
  expires_at: Date;
  viewed_at?: Date;
  submitted_at?: Date;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      limit: number;
      current_page: number;
      total_pages: number;
    };
  };
}

/**
 * Standard API response
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Consent artifact with full details
 */
export interface ConsentArtifactDetail {
  consent_artifact_id: string;
  data_fiduciary_id: string;
  data_principal_id: string;
  principal_fiduciary_map_id?: string;
  external_user_id: string;
  status: 'PENDING' | 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';
  purposes: ConsentArtifactPurpose[];
  requested_at: Date;
  granted_at?: Date;
  expires_at?: Date;
  withdrawn_at?: Date;
  last_validated_at?: Date;
  consent_text_hash: string;
  metadata?: Record<string, any>;
  is_deleted: boolean;
}

/**
 * Query filters for listing consents
 */
export interface ConsentListFilters {
  data_fiduciary_id?: string;
  data_principal_id?: string;
  external_user_id?: string;
  status?: 'PENDING' | 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';
  purpose_id?: string;
  from_date?: Date;
  to_date?: Date;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Consent withdrawal request
 */
export interface WithdrawConsentInput {
  artifact_id: string;
  data_fiduciary_id: string;
  reason?: string;
  notes?: string;
}

/**
 * Response after consent withdrawal
 */
export interface WithdrawConsentResponse {
  artifact_id: string;
  status: 'WITHDRAWN';
  withdrawn_at: Date;
  message: string;
}

/**
 * Consent renewal request
 */
export interface RenewConsentInput {
  artifact_id: string;
  data_fiduciary_id: string;
  extend_by_days?: number; // Optional: custom extension period
}

/**
 * Response after consent renewal
 */
export interface RenewConsentResponse {
  artifact_id: string;
  status: 'ACTIVE';
  old_expires_at: Date;
  new_expires_at: Date;
  message: string;
}

/**
 * Consent history entry
 */
export interface ConsentHistoryEntry {
  consent_history_id: string;
  consent_artifact_id: string;
  action: 'GRANT' | 'UPDATE' | 'WITHDRAW' | 'EXPIRE' | 'VALIDATE';
  previous_status?: 'PENDING' | 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';
  new_status?: 'PENDING' | 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';
  performed_by?: string;
  performed_by_type?: string;
  performed_at: Date;
  notes?: string;
}

/**
 * Consent analytics summary
 */
export interface ConsentAnalytics {
  total_consents: number;
  active_consents: number;
  withdrawn_consents: number;
  expired_consents: number;
  consents_by_status: {
    status: string;
    count: number;
  }[];
  consents_by_purpose: {
    purpose_id: string;
    purpose_title: string;
    count: number;
  }[];
  consents_trend: {
    date: Date;
    granted: number;
    withdrawn: number;
    expired: number;
  }[];
}
