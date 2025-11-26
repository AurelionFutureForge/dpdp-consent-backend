# Integration Guide
## DPDP Consent Management System

**Version:** 1.0
**Last Updated:** November 26, 2025
**API Base URL:** `https://api.dpdp-cms.com/api/v1`

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Reference](#api-reference)
5. [Integration Patterns](#integration-patterns)
6. [Webhooks](#webhooks)
7. [SDKs & Libraries](#sdks--libraries)
8. [Code Examples](#code-examples)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Testing](#testing)
12. [Best Practices](#best-practices)

---

## Overview

The DPDP Consent Management System provides a comprehensive API for managing user consents in compliance with India's Digital Personal Data Protection Act (DPDP). This guide will help you integrate the consent management capabilities into your application.

### What You Can Do

- ✅ Register your organization as a Data Fiduciary
- ✅ Define consent purposes and categories
- ✅ Capture and manage user consents
- ✅ Validate consents in real-time
- ✅ Handle consent renewals and withdrawals
- ✅ Receive webhook notifications for consent events
- ✅ Generate compliance reports and audit trails

### Integration Architecture

```
┌─────────────────────┐
│   Your Application  │
│   (Data Fiduciary)  │
└──────────┬──────────┘
           │
           │ REST API / Webhooks
           │
┌──────────▼──────────┐
│  DPDP Consent CMS   │
│  ┌──────────────┐   │
│  │ Consent API  │   │
│  ├──────────────┤   │
│  │ Purpose Mgmt │   │
│  ├──────────────┤   │
│  │ Audit Trail  │   │
│  └──────────────┘   │
└──────────┬──────────┘
           │
     ┌─────▼─────┐
     │ Database  │
     └───────────┘
```

---

## Getting Started

### Step 1: Register as Data Fiduciary

Contact our team to register your organization. You'll receive:
- `data_fiduciary_id` - Your unique organization identifier
- `api_key` - Public API key for authentication
- `api_secret` - Secret key for secure operations
- `webhook_secret` - For webhook signature verification

### Step 2: Configure Your Environment

```bash
# Add to your .env file
DPDP_API_URL=https://api.dpdp-cms.com/api/v1
DPDP_API_KEY=tc_live_pk_xxxxxxxxxxxxxxxx
DPDP_API_SECRET=your_secret_key_here
DPDP_FIDUCIARY_ID=fid_xxxxxxxx
DPDP_WEBHOOK_SECRET=whsec_xxxxxxxx
```

### Step 3: Test Connection

```bash
# Test API connectivity
curl -X GET https://api.dpdp-cms.com/api/v1/health \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "message": "DPDP API-V1 Working",
#   "status": "healthy",
#   "timestamp": "2025-11-26T12:00:00.000Z"
# }
```

---

## Authentication

### API Key Authentication

Most endpoints require API key authentication in the request headers.

```bash
# Header format
X-API-Key: tc_live_pk_xxxxxxxxxxxxxxxx
Content-Type: application/json
```

### JWT Token Authentication (Admin/User)

For admin operations and user-specific actions, use JWT tokens.

#### Step 1: Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@yourcompany.com"
}

# Response
{
  "success": true,
  "message": "OTP sent to your email"
}
```

#### Step 2: Verify OTP

```bash
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "admin@yourcompany.com",
  "otp_code": "123456"
}

# Response
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "usr_123",
      "email": "admin@yourcompany.com",
      "role": "DPO"
    }
  }
}
```

#### Step 3: Use Access Token

```bash
# Header format
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## API Reference

### Base URL
```
Production: https://api.dpdp-cms.com/api/v1
Staging: https://staging-api.dpdp-cms.com/api/v1
```

### Core Endpoints

#### 1. Purpose Management

##### Get All Active Purposes

```http
GET /purposes/active
X-API-Key: {api_key}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purposes": [
      {
        "purpose_id": "pur_001",
        "title": "Email Marketing Campaigns",
        "description": "Send promotional emails and newsletters",
        "category": {
          "name": "Marketing & Communications",
          "description": "Marketing related purposes"
        },
        "data_fields": ["email", "name", "preferences"],
        "is_mandatory": false,
        "requires_renewal": true,
        "retention_period_days": 730
      }
    ]
  }
}
```

##### Get Purpose by ID

```http
GET /purposes/:purpose_id
X-API-Key: {api_key}
```

##### Create Purpose

```http
POST /purposes/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "data_fiduciary_id": "fid_001",
  "purpose_category_id": "pcat_001",
  "title": "Customer Service Communications",
  "description": "Respond to customer inquiries and provide support",
  "legal_basis": "Section 7 - Legitimate purpose",
  "data_fields": ["email", "phone", "name"],
  "processing_activities": ["email_sending", "phone_calls", "ticket_management"],
  "retention_period_days": 1095,
  "is_mandatory": false,
  "requires_renewal": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purpose created successfully",
  "data": {
    "purpose_id": "pur_new_001",
    "title": "Customer Service Communications",
    "is_active": true,
    "created_at": "2025-11-26T12:00:00.000Z"
  }
}
```

---

#### 2. Consent Management

##### Create Consent

```http
POST /consent/create
X-API-Key: {api_key}
Content-Type: application/json

{
  "data_fiduciary_id": "fid_001",
  "external_user_id": "user_12345",
  "purpose_ids": ["pur_001", "pur_002"],
  "consent_text": "I agree to receive marketing communications",
  "user_data": {
    "email": "user@example.com",
    "phone": "+91-98765-43210",
    "name": "Rajesh Kumar"
  },
  "metadata": {
    "ip_address": "203.0.113.45",
    "user_agent": "Mozilla/5.0",
    "consent_method": "web_form",
    "source": "signup_page"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent granted successfully",
  "data": {
    "consent_artifacts": [
      {
        "consent_artifact_id": "ca_abc123",
        "purpose_id": "pur_001",
        "status": "ACTIVE",
        "granted_at": "2025-11-26T12:00:00.000Z",
        "expires_at": "2026-11-26T12:00:00.000Z"
      },
      {
        "consent_artifact_id": "ca_def456",
        "purpose_id": "pur_002",
        "status": "ACTIVE",
        "granted_at": "2025-11-26T12:00:00.000Z",
        "expires_at": "2026-11-26T12:00:00.000Z"
      }
    ],
    "data_principal_id": "dp_xyz789"
  }
}
```

##### Validate Consent

```http
POST /consent/validate
X-API-Key: {api_key}
Content-Type: application/json

{
  "consent_artifact_id": "ca_abc123",
  "purpose_id": "pur_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "consent_artifact_id": "ca_abc123",
    "status": "ACTIVE",
    "granted_at": "2025-11-26T12:00:00.000Z",
    "expires_at": "2026-11-26T12:00:00.000Z",
    "purpose": {
      "purpose_id": "pur_001",
      "title": "Email Marketing Campaigns"
    },
    "validation_timestamp": "2025-11-26T14:30:00.000Z"
  }
}
```

##### Get User Consents

```http
GET /consent/user?external_user_id=user_12345&data_fiduciary_id=fid_001
X-API-Key: {api_key}
```

**Query Parameters:**
- `external_user_id` - Your system's user identifier (required)
- `data_fiduciary_id` - Your fiduciary ID (required)
- `status` - Filter by status: ACTIVE, WITHDRAWN, EXPIRED (optional)
- `purpose_id` - Filter by purpose (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "consents": [
      {
        "consent_artifact_id": "ca_abc123",
        "purpose": {
          "purpose_id": "pur_001",
          "title": "Email Marketing Campaigns",
          "description": "Send promotional emails"
        },
        "status": "ACTIVE",
        "granted_at": "2025-11-26T12:00:00.000Z",
        "expires_at": "2026-11-26T12:00:00.000Z",
        "can_renew": true,
        "can_withdraw": true
      }
    ],
    "total_count": 1
  }
}
```

##### Withdraw Consent

```http
POST /consent/withdraw
X-API-Key: {api_key}
Content-Type: application/json

{
  "consent_artifact_id": "ca_abc123",
  "reason": "User no longer wishes to receive marketing emails",
  "initiated_by": "USER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent withdrawn successfully",
  "data": {
    "consent_artifact_id": "ca_abc123",
    "status": "WITHDRAWN",
    "withdrawn_at": "2025-11-26T15:00:00.000Z",
    "previous_status": "ACTIVE"
  }
}
```

##### Renew Consent

```http
POST /consent/renew
X-API-Key: {api_key}
Content-Type: application/json

{
  "artifact_id": "ca_abc123",
  "data_fiduciary_id": "fid_001",
  "extend_by_days": 365,
  "initiated_by": "USER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent renewed successfully",
  "data": {
    "renewal_request_id": "ren_xyz123",
    "artifact_id": "ca_abc123",
    "status": "RENEWAL_EXTENDED",
    "current_expires_at": "2026-11-26T12:00:00.000Z",
    "requested_expires_at": "2027-11-26T12:00:00.000Z",
    "message": "Consent renewed successfully. Extended by 365 days."
  }
}
```

---

#### 3. Data Fiduciary Management

##### Get Fiduciary Details

```http
GET /data-fiduciary/:fiduciary_id
Authorization: Bearer {jwt_token}
```

##### Update Fiduciary Settings

```http
PUT /data-fiduciary/:fiduciary_id
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "contact_email": "legal@yourcompany.com",
  "dpo_email": "dpo@yourcompany.com",
  "webhook_url": "https://yourapp.com/webhooks/consent",
  "privacy_policy_url": "https://yourcompany.com/privacy"
}
```

---

## Integration Patterns

### Pattern 1: User Registration Flow

**Scenario:** New user signs up on your platform

```javascript
// Step 1: Show consent purposes to user
const purposes = await fetch(`${API_URL}/purposes/active`, {
  headers: {
    'X-API-Key': API_KEY
  }
});

// Step 2: User selects purposes and submits form
const consentData = {
  data_fiduciary_id: FIDUCIARY_ID,
  external_user_id: newUser.id,
  purpose_ids: selectedPurposes,
  consent_text: "I agree to the terms and conditions",
  user_data: {
    email: newUser.email,
    phone: newUser.phone,
    name: newUser.name
  },
  metadata: {
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    consent_method: 'registration_form'
  }
};

// Step 3: Create consent
const consent = await fetch(`${API_URL}/consent/create`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(consentData)
});

// Step 4: Store consent_artifact_ids in your database
await db.users.update(newUser.id, {
  consent_artifacts: consent.data.consent_artifacts.map(c => c.consent_artifact_id)
});
```

### Pattern 2: Real-time Consent Validation

**Scenario:** Before sending marketing email

```javascript
async function canSendMarketingEmail(userId, purposeId) {
  // Get user's consent artifact for marketing
  const user = await db.users.findById(userId);
  const consentArtifact = user.consent_artifacts.find(
    a => a.purpose_id === purposeId
  );

  if (!consentArtifact) {
    return false;
  }

  // Validate consent with DPDP CMS
  const validation = await fetch(`${API_URL}/consent/validate`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consent_artifact_id: consentArtifact.id,
      purpose_id: purposeId
    })
  });

  const result = await validation.json();
  return result.data.is_valid;
}

// Usage
if (await canSendMarketingEmail(user.id, 'pur_email_marketing')) {
  await sendEmail(user.email, marketingContent);
}
```

### Pattern 3: Consent Management Dashboard

**Scenario:** User views their consents

```javascript
// Frontend: User consent dashboard
async function loadUserConsents(userId) {
  const response = await fetch(
    `${API_URL}/consent/user?external_user_id=${userId}&data_fiduciary_id=${FIDUCIARY_ID}`,
    {
      headers: {
        'X-API-Key': API_KEY
      }
    }
  );

  const data = await response.json();

  // Render consents
  data.data.consents.forEach(consent => {
    renderConsentCard({
      title: consent.purpose.title,
      description: consent.purpose.description,
      status: consent.status,
      grantedAt: consent.granted_at,
      expiresAt: consent.expires_at,
      canWithdraw: consent.can_withdraw,
      onWithdraw: () => withdrawConsent(consent.consent_artifact_id)
    });
  });
}

// Withdraw consent function
async function withdrawConsent(artifactId) {
  const response = await fetch(`${API_URL}/consent/withdraw`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consent_artifact_id: artifactId,
      reason: 'User withdrawal from dashboard',
      initiated_by: 'USER'
    })
  });

  if (response.ok) {
    alert('Consent withdrawn successfully');
    loadUserConsents(userId); // Refresh
  }
}
```

---

## Webhooks

### Webhook Events

The DPDP CMS sends real-time webhook notifications for consent events.

#### Supported Events

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `consent.granted` | New consent created | User grants consent |
| `consent.withdrawn` | Consent withdrawn | User/System withdraws consent |
| `consent.expired` | Consent expired | Consent reaches expiry date |
| `consent.renewed` | Consent renewed | User renews consent |
| `consent.validated` | Consent validated | Real-time validation performed |

### Webhook Configuration

Set your webhook URL in the Data Fiduciary settings:

```bash
PUT /data-fiduciary/:fiduciary_id
Authorization: Bearer {jwt_token}

{
  "webhook_url": "https://yourapp.com/webhooks/dpdp-consent",
  "webhook_secret": "whsec_your_secret_key"
}
```

### Webhook Payload Format

```json
{
  "event_id": "evt_abc123xyz",
  "event_type": "consent.granted",
  "timestamp": "2025-11-26T12:00:00.000Z",
  "data": {
    "consent_artifact_id": "ca_abc123",
    "data_principal_id": "dp_xyz789",
    "external_user_id": "user_12345",
    "purpose_id": "pur_001",
    "purpose_title": "Email Marketing Campaigns",
    "status": "ACTIVE",
    "granted_at": "2025-11-26T12:00:00.000Z",
    "expires_at": "2026-11-26T12:00:00.000Z",
    "metadata": {
      "ip_address": "203.0.113.45",
      "consent_method": "web_form"
    }
  }
}
```

### Webhook Verification

Verify webhook signatures to ensure authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook endpoint
app.post('/webhooks/dpdp-consent', (req, res) => {
  const signature = req.headers['x-dpdp-signature'];
  const payload = req.body;

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  handleWebhookEvent(payload);

  res.status(200).json({ received: true });
});

function handleWebhookEvent(event) {
  switch (event.event_type) {
    case 'consent.granted':
      console.log('New consent granted:', event.data.consent_artifact_id);
      // Update your database
      break;

    case 'consent.withdrawn':
      console.log('Consent withdrawn:', event.data.consent_artifact_id);
      // Stop processing for this user
      break;

    case 'consent.expired':
      console.log('Consent expired:', event.data.consent_artifact_id);
      // Send renewal reminder
      break;
  }
}
```

---

## SDKs & Libraries

### Node.js SDK

```bash
npm install @dpdp-cms/node-sdk
```

**Usage:**

```javascript
const DPDP = require('@dpdp-cms/node-sdk');

const client = new DPDP.Client({
  apiKey: 'tc_live_pk_xxxxxxxx',
  apiSecret: 'your_secret',
  fiduciaryId: 'fid_001',
  environment: 'production' // or 'staging'
});

// Create consent
const consent = await client.consent.create({
  externalUserId: 'user_123',
  purposeIds: ['pur_001', 'pur_002'],
  userData: {
    email: 'user@example.com',
    name: 'John Doe'
  }
});

// Validate consent
const isValid = await client.consent.validate('ca_abc123', 'pur_001');

// Get user consents
const consents = await client.consent.getUserConsents('user_123');
```

### Python SDK

```bash
pip install dpdp-cms-python
```

**Usage:**

```python
from dpdp_cms import DPDPClient

client = DPDPClient(
    api_key='tc_live_pk_xxxxxxxx',
    api_secret='your_secret',
    fiduciary_id='fid_001',
    environment='production'
)

# Create consent
consent = client.consent.create(
    external_user_id='user_123',
    purpose_ids=['pur_001', 'pur_002'],
    user_data={
        'email': 'user@example.com',
        'name': 'John Doe'
    }
)

# Validate consent
is_valid = client.consent.validate('ca_abc123', 'pur_001')
```

---

## Code Examples

### Complete Integration Example (Express.js)

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configuration
const DPDP_API_URL = process.env.DPDP_API_URL;
const DPDP_API_KEY = process.env.DPDP_API_KEY;
const DPDP_FIDUCIARY_ID = process.env.DPDP_FIDUCIARY_ID;
const DPDP_WEBHOOK_SECRET = process.env.DPDP_WEBHOOK_SECRET;

// Helper: DPDP API client
const dpdpAPI = axios.create({
  baseURL: DPDP_API_URL,
  headers: {
    'X-API-Key': DPDP_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Route: User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, name, phone, selectedPurposes } = req.body;

    // 1. Create user in your database
    const user = await db.users.create({ email, name, phone });

    // 2. Create consent in DPDP CMS
    const consentResponse = await dpdpAPI.post('/consent/create', {
      data_fiduciary_id: DPDP_FIDUCIARY_ID,
      external_user_id: user.id,
      purpose_ids: selectedPurposes,
      consent_text: 'I agree to the terms and conditions',
      user_data: { email, name, phone },
      metadata: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        consent_method: 'registration'
      }
    });

    // 3. Store consent artifacts
    await db.users.update(user.id, {
      consent_artifacts: consentResponse.data.data.consent_artifacts
    });

    res.json({
      success: true,
      user: user,
      consents: consentResponse.data.data.consent_artifacts
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Route: Send Marketing Email
app.post('/api/send-marketing-email', async (req, res) => {
  try {
    const { userId, emailContent } = req.body;

    // 1. Get user data
    const user = await db.users.findById(userId);

    // 2. Find marketing consent artifact
    const marketingConsent = user.consent_artifacts.find(
      c => c.purpose_id === 'pur_email_marketing'
    );

    if (!marketingConsent) {
      return res.status(403).json({ error: 'No marketing consent' });
    }

    // 3. Validate consent
    const validation = await dpdpAPI.post('/consent/validate', {
      consent_artifact_id: marketingConsent.consent_artifact_id,
      purpose_id: 'pur_email_marketing'
    });

    if (!validation.data.data.is_valid) {
      return res.status(403).json({ error: 'Consent not valid or expired' });
    }

    // 4. Send email
    await emailService.send({
      to: user.email,
      subject: 'Marketing Campaign',
      body: emailContent
    });

    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Route: User Consent Dashboard
app.get('/api/user/:userId/consents', async (req, res) => {
  try {
    const { userId } = req.params;

    const response = await dpdpAPI.get('/consent/user', {
      params: {
        external_user_id: userId,
        data_fiduciary_id: DPDP_FIDUCIARY_ID
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Get consents error:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

// Route: Withdraw Consent
app.post('/api/user/:userId/withdraw-consent', async (req, res) => {
  try {
    const { userId } = req.params;
    const { consentArtifactId, reason } = req.body;

    const response = await dpdpAPI.post('/consent/withdraw', {
      consent_artifact_id: consentArtifactId,
      reason: reason || 'User requested withdrawal',
      initiated_by: 'USER'
    });

    res.json(response.data);
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Failed to withdraw consent' });
  }
});

// Webhook: Handle DPDP Events
app.post('/webhooks/dpdp-consent', (req, res) => {
  const signature = req.headers['x-dpdp-signature'];
  const payload = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', DPDP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Handle event
  handleWebhook(payload);

  res.status(200).json({ received: true });
});

async function handleWebhook(event) {
  switch (event.event_type) {
    case 'consent.withdrawn':
      // Update local database
      await db.consents.updateStatus(
        event.data.consent_artifact_id,
        'WITHDRAWN'
      );

      // Stop any ongoing processing
      await stopProcessingForUser(event.data.external_user_id);
      break;

    case 'consent.expired':
      // Send renewal reminder
      await sendRenewalReminder(event.data.external_user_id);
      break;
  }
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description | Solution |
|-------------|------------|-------------|----------|
| 400 | `INVALID_REQUEST` | Invalid request parameters | Check request body format |
| 401 | `UNAUTHORIZED` | Invalid API key or token | Verify authentication credentials |
| 403 | `FORBIDDEN` | Insufficient permissions | Check user role and permissions |
| 404 | `NOT_FOUND` | Resource not found | Verify ID exists |
| 409 | `CONFLICT` | Resource already exists | Use different identifier |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff strategy |
| 500 | `INTERNAL_ERROR` | Server error | Contact support |

### Error Handling Best Practices

```javascript
async function createConsentWithRetry(data, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await dpdpAPI.post('/consent/create', data);
      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry on client errors
      if (error.response && error.response.status < 500) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

---

## Rate Limiting

### Limits

| Plan | Requests per Minute | Requests per Day |
|------|---------------------|------------------|
| Free | 100 | 10,000 |
| Standard | 1,000 | 100,000 |
| Enterprise | 5,000 | 500,000 |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1637856000
```

### Handling Rate Limits

```javascript
function handleRateLimitResponse(response) {
  const remaining = parseInt(response.headers['x-ratelimit-remaining']);
  const reset = parseInt(response.headers['x-ratelimit-reset']);

  if (remaining < 10) {
    console.warn('Approaching rate limit. Consider implementing backoff.');
  }

  if (response.status === 429) {
    const retryAfter = (reset * 1000) - Date.now();
    console.log(`Rate limited. Retry after ${retryAfter}ms`);
    return retryAfter;
  }
}
```

---

## Testing

### Test Environment

```bash
# Test API Base URL
https://staging-api.dpdp-cms.com/api/v1

# Test API Keys (provided after registration)
DPDP_TEST_API_KEY=tc_test_pk_xxxxxxxx
DPDP_TEST_FIDUCIARY_ID=fid_test_001
```

### Sample Test Users

```javascript
const testUsers = {
  activeConsent: {
    external_id: 'test_user_active_001',
    email: 'active@test.com'
  },
  expiredConsent: {
    external_id: 'test_user_expired_001',
    email: 'expired@test.com'
  },
  noConsent: {
    external_id: 'test_user_none_001',
    email: 'none@test.com'
  }
};
```

---

## Best Practices

### 1. Cache Consent Validations

```javascript
const consentCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function validateConsentCached(artifactId, purposeId) {
  const cacheKey = `${artifactId}:${purposeId}`;
  const cached = consentCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.isValid;
  }

  const result = await dpdpAPI.post('/consent/validate', {
    consent_artifact_id: artifactId,
    purpose_id: purposeId
  });

  consentCache.set(cacheKey, {
    isValid: result.data.data.is_valid,
    timestamp: Date.now()
  });

  return result.data.data.is_valid;
}
```

### 2. Implement Webhook Retry Logic

Ensure your webhook endpoint is idempotent and can handle retries.

### 3. Store Minimal PII

Only send necessary user data to DPDP CMS. The system references users by `external_user_id`.

### 4. Regular Consent Audits

Periodically sync your local consent state with DPDP CMS.

### 5. User-Friendly Consent UI

Make it easy for users to understand and manage their consents.

---

## Support

### Documentation
- API Reference: https://api.dpdp-cms.com/api-docs
- Developer Portal: https://developers.dpdp-cms.com

### Contact
- Email: support@dpdp-cms.com
- Slack: https://dpdp-cms.slack.com
- GitHub: https://github.com/dpdp-cms

---

**End of Integration Guide**

