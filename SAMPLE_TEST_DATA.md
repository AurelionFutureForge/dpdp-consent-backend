# Sample Test Data
## DPDP Consent Management System

**Version:** 1.0
**Last Updated:** November 26, 2025
**Purpose:** Comprehensive test data for development, testing, and demonstration

---

## Table of Contents
1. [Data Overview](#data-overview)
2. [User Data](#user-data)
3. [Data Fiduciary Data](#data-fiduciary-data)
4. [Data Principal Data](#data-principal-data)
5. [Purpose & Purpose Category Data](#purpose--purpose-category-data)
6. [Consent Artifact Data](#consent-artifact-data)
7. [Test Scenarios](#test-scenarios)
8. [Database Seed Script](#database-seed-script)

---

## Data Overview

### Purpose
This document provides sample test data for:
- **Unit Testing** - Isolated component testing
- **Integration Testing** - Service interaction testing
- **API Testing** - Endpoint validation
- **Demo/Staging** - Client demonstrations
- **Development** - Local development environment

### Data Characteristics
- ✅ DPDP Act compliant
- ✅ Realistic business scenarios
- ✅ Edge cases covered
- ✅ Multiple user types
- ✅ Various consent states

---

## User Data

### Admin Users

```json
[
  {
    "user_id": "usr_admin_001",
    "name": "System Administrator",
    "email": "admin@dpdp-cms.com",
    "role": "SYSTEM_ADMIN",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "user_id": "usr_dpo_001",
    "name": "Rajesh Kumar",
    "email": "dpo@techcorp.in",
    "role": "DPO",
    "data_fiduciary_id": "fid_001",
    "is_active": true,
    "created_at": "2025-01-15T00:00:00Z"
  },
  {
    "user_id": "usr_auditor_001",
    "name": "Priya Sharma",
    "email": "auditor@compliance.in",
    "role": "AUDITOR",
    "is_active": true,
    "created_at": "2025-02-01T00:00:00Z"
  }
]
```

### OTP Test Data

```json
[
  {
    "otp_id": "otp_001",
    "user_id": "usr_admin_001",
    "email": "admin@dpdp-cms.com",
    "otp_code": "123456",
    "expires_at": "2025-11-26T12:30:00Z",
    "created_at": "2025-11-26T12:20:00Z"
  },
  {
    "otp_id": "otp_expired_001",
    "user_id": "usr_dpo_001",
    "email": "dpo@techcorp.in",
    "otp_code": "999999",
    "expires_at": "2025-11-25T10:00:00Z",
    "created_at": "2025-11-25T09:50:00Z"
  }
]
```

---

## Data Fiduciary Data

### Sample Organizations

```json
[
  {
    "data_fiduciary_id": "fid_001",
    "name": "TechCorp India",
    "legal_name": "TechCorp India Private Limited",
    "registration_number": "CIN-U72900DL2020PTC123456",
    "contact_email": "legal@techcorp.in",
    "contact_phone": "+91-11-12345678",
    "dpo_email": "dpo@techcorp.in",
    "dpo_phone": "+91-11-12345679",
    "website_url": "https://techcorp.in",
    "api_key": "tc_live_pk_a1b2c3d4e5f6g7h8i9j0",
    "api_secret": "$2b$10$hashed_secret_value_here",
    "webhook_url": "https://api.techcorp.in/webhooks/consent",
    "webhook_secret": "whsec_techcorp_secret_123",
    "rate_limit_per_min": 1000,
    "rate_limit_per_day": 100000,
    "is_public": true,
    "is_active": true,
    "is_deleted": false,
    "logo_url": "https://cdn.techcorp.in/logo.png",
    "privacy_policy_url": "https://techcorp.in/privacy",
    "terms_url": "https://techcorp.in/terms",
    "gdpr_compliant": true,
    "dpdp_compliant": true,
    "created_at": "2025-01-10T00:00:00Z",
    "updated_at": "2025-11-20T00:00:00Z"
  },
  {
    "data_fiduciary_id": "fid_002",
    "name": "HealthCare Plus",
    "legal_name": "HealthCare Plus Private Limited",
    "registration_number": "CIN-U85100MH2021PTC234567",
    "contact_email": "contact@healthcareplus.in",
    "contact_phone": "+91-22-87654321",
    "dpo_email": "privacy@healthcareplus.in",
    "website_url": "https://healthcareplus.in",
    "api_key": "hcp_live_pk_z9y8x7w6v5u4t3s2r1q0",
    "api_secret": "$2b$10$another_hashed_secret_value",
    "rate_limit_per_min": 500,
    "rate_limit_per_day": 50000,
    "is_public": true,
    "is_active": true,
    "is_deleted": false,
    "privacy_policy_url": "https://healthcareplus.in/privacy-policy",
    "dpdp_compliant": true,
    "created_at": "2025-02-15T00:00:00Z"
  },
  {
    "data_fiduciary_id": "fid_003",
    "name": "EduLearn Platform",
    "legal_name": "EduLearn Technologies LLP",
    "registration_number": "LLP-AAB-1234",
    "contact_email": "support@edulearn.in",
    "contact_phone": "+91-80-98765432",
    "website_url": "https://edulearn.in",
    "api_key": "edu_test_pk_test1234567890",
    "api_secret": "$2b$10$test_secret_value_edulearn",
    "is_public": true,
    "is_active": false,
    "is_deleted": false,
    "dpdp_compliant": true,
    "created_at": "2025-10-01T00:00:00Z"
  }
]
```

### Platform Submissions

```json
[
  {
    "platform_submission_id": "psub_001",
    "data_fiduciary_id": "fid_001",
    "platform_type": "WEBSITE",
    "url": "https://techcorp.in",
    "description": "Main corporate website",
    "status": "APPROVED",
    "submitted_by": "usr_dpo_001",
    "submitted_at": "2025-01-20T10:00:00Z",
    "approved_by": "usr_admin_001",
    "approved_at": "2025-01-21T14:30:00Z",
    "created_at": "2025-01-20T10:00:00Z"
  },
  {
    "platform_submission_id": "psub_002",
    "data_fiduciary_id": "fid_001",
    "platform_type": "GOOGLE_PLAY_STORE",
    "url": "https://play.google.com/store/apps/details?id=com.techcorp.app",
    "description": "TechCorp Mobile App for Android",
    "status": "APPROVED",
    "submitted_by": "usr_dpo_001",
    "submitted_at": "2025-02-10T09:00:00Z",
    "approved_by": "usr_admin_001",
    "approved_at": "2025-02-11T11:00:00Z",
    "created_at": "2025-02-10T09:00:00Z"
  },
  {
    "platform_submission_id": "psub_003",
    "data_fiduciary_id": "fid_002",
    "platform_type": "WEBSITE",
    "url": "https://healthcareplus.in",
    "description": "HealthCare Plus patient portal",
    "status": "IN_REVIEW",
    "submitted_by": "dpo_healthcare_001",
    "submitted_at": "2025-11-20T15:00:00Z",
    "created_at": "2025-11-20T15:00:00Z"
  }
]
```

---

## Data Principal Data

### Sample Users (Data Principals)

```json
[
  {
    "data_principal_id": "dp_001",
    "external_id": "user_techcorp_1001",
    "email": "arjun.mehta@example.com",
    "phone": "+91-98765-43210",
    "language": "en",
    "created_at": "2025-03-01T00:00:00Z",
    "last_login": "2025-11-25T18:30:00Z",
    "is_deleted": false
  },
  {
    "data_principal_id": "dp_002",
    "external_id": "user_techcorp_1002",
    "email": "sneha.patel@example.com",
    "phone": "+91-98765-43211",
    "language": "hi",
    "created_at": "2025-03-15T00:00:00Z",
    "last_login": "2025-11-26T09:15:00Z",
    "is_deleted": false
  },
  {
    "data_principal_id": "dp_003",
    "external_id": "user_healthcare_2001",
    "email": "vikram.singh@example.com",
    "phone": "+91-98765-43212",
    "language": "en",
    "created_at": "2025-04-10T00:00:00Z",
    "last_login": "2025-11-24T14:20:00Z",
    "is_deleted": false
  },
  {
    "data_principal_id": "dp_004",
    "external_id": "user_techcorp_1003",
    "email": "priya.sharma@example.com",
    "phone": "+91-98765-43213",
    "language": "en",
    "created_at": "2025-05-20T00:00:00Z",
    "last_login": "2025-11-20T11:00:00Z",
    "is_deleted": false
  },
  {
    "data_principal_id": "dp_deleted_001",
    "external_id": "user_deleted_9999",
    "email": "deleted.user@example.com",
    "language": "en",
    "created_at": "2025-01-01T00:00:00Z",
    "is_deleted": true,
    "deleted_at": "2025-10-15T00:00:00Z"
  }
]
```

---

## Purpose & Purpose Category Data

### Purpose Categories

```json
[
  {
    "purpose_category_id": "pcat_001",
    "data_fiduciary_id": "fid_001",
    "name": "Marketing & Communications",
    "description": "Purposes related to marketing, promotions, and customer communications",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_category_id": "pcat_002",
    "data_fiduciary_id": "fid_001",
    "name": "Account Management",
    "description": "Essential purposes for account creation and management",
    "display_order": 2,
    "is_active": true,
    "created_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_category_id": "pcat_003",
    "data_fiduciary_id": "fid_002",
    "name": "Healthcare Services",
    "description": "Medical and healthcare-related data processing",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-02-16T00:00:00Z"
  }
]
```

### Purposes

```json
[
  {
    "purpose_id": "pur_001",
    "data_fiduciary_id": "fid_001",
    "purpose_category_id": "pcat_001",
    "title": "Email Marketing Campaigns",
    "description": "Send promotional emails, newsletters, and product updates",
    "legal_basis": "Section 6(1) - Consent for specified purpose",
    "data_fields": ["email", "name", "preferences"],
    "processing_activities": ["email_sending", "list_segmentation", "analytics"],
    "retention_period_days": 730,
    "is_mandatory": false,
    "is_active": true,
    "requires_renewal": true,
    "renewal_period_days": 365,
    "display_order": 1,
    "created_at": "2025-01-12T00:00:00Z",
    "updated_at": "2025-11-10T00:00:00Z"
  },
  {
    "purpose_id": "pur_002",
    "data_fiduciary_id": "fid_001",
    "purpose_category_id": "pcat_001",
    "title": "SMS Notifications",
    "description": "Send transactional and promotional SMS messages",
    "legal_basis": "Section 6(1) - Consent for specified purpose",
    "data_fields": ["phone", "name"],
    "processing_activities": ["sms_sending", "delivery_tracking"],
    "retention_period_days": 365,
    "is_mandatory": false,
    "is_active": true,
    "requires_renewal": false,
    "display_order": 2,
    "created_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_id": "pur_003",
    "data_fiduciary_id": "fid_001",
    "purpose_category_id": "pcat_002",
    "title": "Account Creation & Authentication",
    "description": "Create and maintain user account, authentication, security",
    "legal_basis": "Section 7 - Legitimate purpose",
    "data_fields": ["email", "phone", "name", "password_hash"],
    "processing_activities": ["account_creation", "authentication", "security"],
    "retention_period_days": 1825,
    "is_mandatory": true,
    "is_active": true,
    "requires_renewal": false,
    "display_order": 1,
    "created_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_id": "pur_004",
    "data_fiduciary_id": "fid_002",
    "purpose_category_id": "pcat_003",
    "title": "Medical Records Management",
    "description": "Store and manage patient medical records and history",
    "legal_basis": "Section 7 - Healthcare services",
    "data_fields": ["name", "dob", "medical_history", "prescriptions", "test_results"],
    "processing_activities": ["record_storage", "doctor_access", "report_generation"],
    "retention_period_days": 3650,
    "is_mandatory": true,
    "is_active": true,
    "requires_renewal": false,
    "display_order": 1,
    "created_at": "2025-02-16T00:00:00Z"
  },
  {
    "purpose_id": "pur_005",
    "data_fiduciary_id": "fid_001",
    "purpose_category_id": "pcat_001",
    "title": "Personalized Recommendations",
    "description": "Analyze user behavior to provide personalized product recommendations",
    "legal_basis": "Section 6(1) - Consent for specified purpose",
    "data_fields": ["browsing_history", "purchase_history", "preferences"],
    "processing_activities": ["behavior_analysis", "recommendation_engine", "profiling"],
    "retention_period_days": 730,
    "is_mandatory": false,
    "is_active": true,
    "requires_renewal": true,
    "renewal_period_days": 365,
    "display_order": 3,
    "created_at": "2025-01-15T00:00:00Z"
  }
]
```

### Purpose Versions

```json
[
  {
    "purpose_version_id": "pv_001",
    "purpose_id": "pur_001",
    "version_number": 1,
    "title": "Email Marketing Campaigns",
    "description": "Send promotional emails, newsletters, and product updates",
    "language_code": "en",
    "is_current": true,
    "created_at": "2025-01-12T00:00:00Z",
    "published_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_version_id": "pv_002",
    "purpose_id": "pur_002",
    "version_number": 1,
    "title": "SMS Notifications",
    "description": "Send transactional and promotional SMS messages",
    "language_code": "en",
    "is_current": true,
    "created_at": "2025-01-12T00:00:00Z",
    "published_at": "2025-01-12T00:00:00Z"
  },
  {
    "purpose_version_id": "pv_003",
    "purpose_id": "pur_003",
    "version_number": 1,
    "title": "Account Creation & Authentication",
    "description": "Create and maintain user account",
    "language_code": "en",
    "is_current": true,
    "created_at": "2025-01-12T00:00:00Z",
    "published_at": "2025-01-12T00:00:00Z"
  }
]
```

---

## Consent Artifact Data

### Active Consents

```json
[
  {
    "consent_artifact_id": "ca_001",
    "data_fiduciary_id": "fid_001",
    "data_principal_id": "dp_001",
    "purpose_id": "pur_001",
    "purpose_version_id": "pv_001",
    "status": "ACTIVE",
    "requested_at": "2025-03-01T10:00:00Z",
    "granted_at": "2025-03-01T10:05:00Z",
    "expires_at": "2026-03-01T10:05:00Z",
    "metadata": {
      "consent_method": "web_form",
      "ip_address": "203.0.113.45",
      "user_agent": "Mozilla/5.0"
    },
    "consent_text_hash": "sha256:abc123...",
    "is_deleted": false
  },
  {
    "consent_artifact_id": "ca_002",
    "data_fiduciary_id": "fid_001",
    "data_principal_id": "dp_001",
    "purpose_id": "pur_002",
    "purpose_version_id": "pv_002",
    "status": "ACTIVE",
    "requested_at": "2025-03-01T10:05:00Z",
    "granted_at": "2025-03-01T10:05:30Z",
    "expires_at": "2026-03-01T10:05:30Z",
    "metadata": {
      "consent_method": "web_form",
      "ip_address": "203.0.113.45"
    },
    "is_deleted": false
  },
  {
    "consent_artifact_id": "ca_003",
    "data_fiduciary_id": "fid_001",
    "data_principal_id": "dp_002",
    "purpose_id": "pur_001",
    "purpose_version_id": "pv_001",
    "status": "ACTIVE",
    "requested_at": "2025-03-15T14:00:00Z",
    "granted_at": "2025-03-15T14:02:00Z",
    "expires_at": "2026-03-15T14:02:00Z",
    "metadata": {
      "consent_method": "mobile_app",
      "device_id": "device_123"
    },
    "is_deleted": false
  }
]
```

### Withdrawn Consents

```json
[
  {
    "consent_artifact_id": "ca_withdrawn_001",
    "data_fiduciary_id": "fid_001",
    "data_principal_id": "dp_004",
    "purpose_id": "pur_005",
    "purpose_version_id": "pv_001",
    "status": "WITHDRAWN",
    "requested_at": "2025-05-20T11:00:00Z",
    "granted_at": "2025-05-20T11:05:00Z",
    "withdrawn_at": "2025-11-10T16:30:00Z",
    "metadata": {
      "consent_method": "web_form",
      "withdrawal_reason": "User requested data deletion"
    },
    "is_deleted": false
  }
]
```

### Expired Consents

```json
[
  {
    "consent_artifact_id": "ca_expired_001",
    "data_fiduciary_id": "fid_001",
    "data_principal_id": "dp_003",
    "purpose_id": "pur_001",
    "purpose_version_id": "pv_001",
    "status": "EXPIRED",
    "requested_at": "2024-01-01T10:00:00Z",
    "granted_at": "2024-01-01T10:05:00Z",
    "expires_at": "2025-01-01T10:05:00Z",
    "metadata": {
      "consent_method": "email_link"
    },
    "is_deleted": false
  }
]
```

---

## Test Scenarios

### Scenario 1: New User Registration & Consent Flow

```json
{
  "scenario_name": "New User Consent Grant",
  "steps": [
    {
      "step": 1,
      "action": "User registers",
      "data": {
        "external_id": "user_new_001",
        "email": "newuser@example.com",
        "phone": "+91-98765-00001"
      }
    },
    {
      "step": 2,
      "action": "System presents purposes",
      "purposes": ["pur_003", "pur_001", "pur_002"]
    },
    {
      "step": 3,
      "action": "User grants consents",
      "granted": ["pur_003", "pur_001"],
      "rejected": ["pur_002"]
    },
    {
      "step": 4,
      "action": "Verify consent artifacts created",
      "expected_count": 2,
      "expected_status": "ACTIVE"
    }
  ]
}
```

### Scenario 2: Consent Withdrawal

```json
{
  "scenario_name": "User Withdraws Marketing Consent",
  "prerequisite": "User has active consent for pur_001",
  "steps": [
    {
      "step": 1,
      "action": "User requests withdrawal",
      "artifact_id": "ca_001"
    },
    {
      "step": 2,
      "action": "System updates status",
      "expected_status": "WITHDRAWN",
      "expected_fields": {
        "withdrawn_at": "current_timestamp",
        "status": "WITHDRAWN"
      }
    },
    {
      "step": 3,
      "action": "Audit log created",
      "audit_action": "UPDATE",
      "initiator": "USER"
    }
  ]
}
```

### Scenario 3: Consent Renewal

```json
{
  "scenario_name": "Renew Expiring Consent",
  "prerequisite": "User has consent expiring in 30 days",
  "steps": [
    {
      "step": 1,
      "action": "System sends renewal notification",
      "notification_type": "consent_renewal_reminder"
    },
    {
      "step": 2,
      "action": "User initiates renewal",
      "artifact_id": "ca_001",
      "extend_by_days": 365
    },
    {
      "step": 3,
      "action": "System extends expires_at",
      "expected_new_expiry": "original_expiry + 365 days"
    },
    {
      "step": 4,
      "action": "Renewal history recorded in metadata"
    }
  ]
}
```

---

## Database Seed Script

### TypeScript Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in test environment only)
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.consentArtifact.deleteMany({});
    await prisma.purposeVersion.deleteMany({});
    await prisma.purpose.deleteMany({});
    await prisma.purposeCategory.deleteMany({});
    await prisma.dataPrincipal.deleteMany({});
    await prisma.oTP.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.dataFiduciary.deleteMany({});
  }

  // Create Users
  console.log('👤 Creating users...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@dpdp-cms.com',
      role: 'SYSTEM_ADMIN',
      is_active: true,
    },
  });

  // Create Data Fiduciaries
  console.log('🏢 Creating data fiduciaries...');
  const techCorp = await prisma.dataFiduciary.create({
    data: {
      name: 'TechCorp India',
      legal_name: 'TechCorp India Private Limited',
      registration_number: 'CIN-U72900DL2020PTC123456',
      contact_email: 'legal@techcorp.in',
      contact_phone: '+91-11-12345678',
      dpo_email: 'dpo@techcorp.in',
      website_url: 'https://techcorp.in',
      api_key: 'tc_live_pk_' + generateRandomString(24),
      api_secret: await bcrypt.hash('secret_techcorp_123', 10),
      is_active: true,
      dpdp_compliant: true,
    },
  });

  const healthCarePlus = await prisma.dataFiduciary.create({
    data: {
      name: 'HealthCare Plus',
      legal_name: 'HealthCare Plus Private Limited',
      registration_number: 'CIN-U85100MH2021PTC234567',
      contact_email: 'contact@healthcareplus.in',
      contact_phone: '+91-22-87654321',
      website_url: 'https://healthcareplus.in',
      api_key: 'hcp_live_pk_' + generateRandomString(24),
      api_secret: await bcrypt.hash('secret_healthcare_123', 10),
      is_active: true,
      dpdp_compliant: true,
    },
  });

  // Create Data Principals
  console.log('👥 Creating data principals...');
  const principals = await Promise.all([
    prisma.dataPrincipal.create({
      data: {
        external_id: 'user_techcorp_1001',
        email: 'arjun.mehta@example.com',
        phone: '+91-98765-43210',
        language: 'en',
      },
    }),
    prisma.dataPrincipal.create({
      data: {
        external_id: 'user_techcorp_1002',
        email: 'sneha.patel@example.com',
        phone: '+91-98765-43211',
        language: 'hi',
      },
    }),
    prisma.dataPrincipal.create({
      data: {
        external_id: 'user_healthcare_2001',
        email: 'vikram.singh@example.com',
        phone: '+91-98765-43212',
        language: 'en',
      },
    }),
  ]);

  // Create Purpose Categories
  console.log('📂 Creating purpose categories...');
  const marketingCategory = await prisma.purposeCategory.create({
    data: {
      data_fiduciary_id: techCorp.data_fiduciary_id,
      name: 'Marketing & Communications',
      description: 'Purposes related to marketing, promotions, and customer communications',
      display_order: 1,
      is_active: true,
    },
  });

  const accountCategory = await prisma.purposeCategory.create({
    data: {
      data_fiduciary_id: techCorp.data_fiduciary_id,
      name: 'Account Management',
      description: 'Essential purposes for account creation and management',
      display_order: 2,
      is_active: true,
    },
  });

  // Create Purposes
  console.log('🎯 Creating purposes...');
  const emailMarketingPurpose = await prisma.purpose.create({
    data: {
      data_fiduciary_id: techCorp.data_fiduciary_id,
      purpose_category_id: marketingCategory.purpose_category_id,
      title: 'Email Marketing Campaigns',
      description: 'Send promotional emails, newsletters, and product updates',
      legal_basis: 'Section 6(1) - Consent for specified purpose',
      data_fields: ['email', 'name', 'preferences'],
      processing_activities: ['email_sending', 'list_segmentation', 'analytics'],
      retention_period_days: 730,
      is_mandatory: false,
      is_active: true,
      requires_renewal: true,
      renewal_period_days: 365,
      display_order: 1,
    },
  });

  const smsNotificationPurpose = await prisma.purpose.create({
    data: {
      data_fiduciary_id: techCorp.data_fiduciary_id,
      purpose_category_id: marketingCategory.purpose_category_id,
      title: 'SMS Notifications',
      description: 'Send transactional and promotional SMS messages',
      legal_basis: 'Section 6(1) - Consent for specified purpose',
      data_fields: ['phone', 'name'],
      processing_activities: ['sms_sending', 'delivery_tracking'],
      retention_period_days: 365,
      is_mandatory: false,
      is_active: true,
      display_order: 2,
    },
  });

  // Create Purpose Versions
  console.log('📝 Creating purpose versions...');
  const emailPurposeVersion = await prisma.purposeVersion.create({
    data: {
      purpose_id: emailMarketingPurpose.purpose_id,
      version_number: 1,
      title: 'Email Marketing Campaigns',
      description: 'Send promotional emails, newsletters, and product updates',
      language_code: 'en',
      is_current: true,
    },
  });

  const smsPurposeVersion = await prisma.purposeVersion.create({
    data: {
      purpose_id: smsNotificationPurpose.purpose_id,
      version_number: 1,
      title: 'SMS Notifications',
      description: 'Send transactional and promotional SMS messages',
      language_code: 'en',
      is_current: true,
    },
  });

  // Create Consent Artifacts
  console.log('✅ Creating consent artifacts...');
  await prisma.consentArtifact.createMany({
    data: [
      {
        data_fiduciary_id: techCorp.data_fiduciary_id,
        data_principal_id: principals[0].data_principal_id,
        purpose_id: emailMarketingPurpose.purpose_id,
        purpose_version_id: emailPurposeVersion.purpose_version_id,
        status: 'ACTIVE',
        granted_at: new Date('2025-03-01T10:05:00Z'),
        expires_at: new Date('2026-03-01T10:05:00Z'),
        metadata: {
          consent_method: 'web_form',
          ip_address: '203.0.113.45',
        },
      },
      {
        data_fiduciary_id: techCorp.data_fiduciary_id,
        data_principal_id: principals[0].data_principal_id,
        purpose_id: smsNotificationPurpose.purpose_id,
        purpose_version_id: smsPurposeVersion.purpose_version_id,
        status: 'ACTIVE',
        granted_at: new Date('2025-03-01T10:05:30Z'),
        expires_at: new Date('2026-03-01T10:05:30Z'),
        metadata: {
          consent_method: 'web_form',
        },
      },
      {
        data_fiduciary_id: techCorp.data_fiduciary_id,
        data_principal_id: principals[1].data_principal_id,
        purpose_id: emailMarketingPurpose.purpose_id,
        purpose_version_id: emailPurposeVersion.purpose_version_id,
        status: 'ACTIVE',
        granted_at: new Date('2025-03-15T14:02:00Z'),
        expires_at: new Date('2026-03-15T14:02:00Z'),
        metadata: {
          consent_method: 'mobile_app',
          device_id: 'device_123',
        },
      },
    ],
  });

  console.log('✨ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: 1`);
  console.log(`   Data Fiduciaries: 2`);
  console.log(`   Data Principals: ${principals.length}`);
  console.log(`   Purpose Categories: 2`);
  console.log(`   Purposes: 2`);
  console.log(`   Consent Artifacts: 3`);
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running the Seed Script

```bash
# Run seed script
npm run seed

# Or with Prisma directly
npx prisma db seed
```

---

## API Test Data Examples

### POST /api/v1/auth/login

```json
{
  "email": "admin@dpdp-cms.com"
}
```

### POST /api/v1/auth/verify-otp

```json
{
  "email": "admin@dpdp-cms.com",
  "otp_code": "123456"
}
```

### POST /api/v1/consent/create

```json
{
  "data_fiduciary_id": "fid_001",
  "external_user_id": "user_techcorp_1001",
  "purpose_ids": ["pur_001", "pur_002"],
  "consent_text": "I agree to receive marketing communications",
  "metadata": {
    "ip_address": "203.0.113.45",
    "user_agent": "Mozilla/5.0"
  }
}
```

### POST /api/v1/consent/withdraw

```json
{
  "consent_artifact_id": "ca_001",
  "reason": "User no longer wishes to receive marketing emails"
}
```

### POST /api/v1/consent/renew

```json
{
  "artifact_id": "ca_001",
  "data_fiduciary_id": "fid_001",
  "extend_by_days": 365,
  "initiated_by": "USER"
}
```

---

**End of Sample Test Data**

