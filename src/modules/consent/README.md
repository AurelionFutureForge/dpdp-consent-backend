# Consent Collection API Documentation

## Overview
This module implements the complete consent collection flow as per the **Digital Personal Data Protection (DPDP) Act, 2023**. The flow ensures transparent, auditable, and compliant consent management between Data Principals (users), Data Fiduciaries (organizations), and the Consent Manager System (CMS).

## Architecture

The consent flow follows this sequence:

```
Data Principal (User) <-> Data Fiduciary (Bank/Company) <-> CMS (Consent Manager System)
```

## API Endpoints

### 1. Initiate Consent Request
**Data Fiduciary initiates consent request**

```http
POST /api/v1/consents/initiate
```

**Request Body:**
```json
{
  "data_fiduciary_id": "uuid",
  "user_id": "external_user_id",
  "purposes": ["purpose_id_1", "purpose_id_2"],
  "data_fields": ["name", "email", "phone"],
  "duration": 365,
  "language": "en",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent request initiated successfully",
  "data": {
    "cms_request_id": "uuid",
    "notice_url": "http://cms.example.com/consents/uuid",
    "status": "INITIATED",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

---

### 2. Get Consent Notice
**Data Principal views consent notice (Public endpoint)**

```http
GET /consents/:cms_request_id?language=en
```

**Response:**
```json
{
  "success": true,
  "message": "Consent notice retrieved successfully",
  "data": {
    "cms_request_id": "uuid",
    "data_fiduciary": {
      "data_fiduciary_id": "uuid",
      "name": "Trust Bank",
      "legal_name": "Trust Bank Ltd.",
      "logo_url": "https://...",
      "contact_email": "privacy@trustbank.com",
      "website_url": "https://trustbank.com",
      "privacy_policy_url": "https://trustbank.com/privacy"
    },
    "purposes": [
      {
        "purpose_id": "uuid",
        "purpose_version_id": "uuid",
        "version_number": 1,
        "title": "Account Opening",
        "description": "To process your account opening request",
        "legal_basis": "Section 6(1)(a) DPDP Act 2023",
        "data_fields": ["name", "email", "phone", "address"],
        "processing_activities": ["verification", "kyc"],
        "retention_period_days": 365,
        "is_mandatory": true
      }
    ],
    "data_fields": ["name", "email", "phone", "address"],
    "retention_policy": {
      "retention_period_days": 365,
      "withdrawal_policy": "You can withdraw your consent at any time..."
    },
    "language_config": {
      "language_code": "en",
      "translations": {}
    },
    "valid_until": "2024-12-31T23:59:59Z",
    "mandatory_purposes": ["purpose_id_1"]
  }
}
```

---

### 3. Submit Consent
**Data Principal submits consent**

```http
POST /api/v1/consents/submit
```

**Request Body:**
```json
{
  "cms_request_id": "uuid",
  "selected_purposes": ["purpose_id_1", "purpose_id_2"],
  "agree": true,
  "language_code": "en",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent submitted successfully",
  "data": {
    "artifact_id": "ART_5001",
    "status": "ACTIVE",
    "valid_till": "2025-12-31T23:59:59Z",
    "purposes": [
      {
        "purpose_id": "uuid",
        "purpose_version_id": "uuid",
        "title": "Account Opening",
        "granted_at": "2024-01-01T00:00:00Z"
      }
    ],
    "hash": "sha256_hash_of_consent"
  }
}
```

**Webhook Notification (sent to Data Fiduciary):**
```json
{
  "event_type": "consent.granted",
  "artifact_id": "ART_5001",
  "data_fiduciary_id": "uuid",
  "user_id": "external_user_id",
  "purposes": [
    {
      "purpose_id": "uuid",
      "purpose_version_id": "uuid",
      "title": "Account Opening"
    }
  ],
  "status": "ACTIVE",
  "valid_till": "2025-12-31T23:59:59Z",
  "granted_at": "2024-01-01T00:00:00Z",
  "metadata": {}
}
```

---

### 4. Validate Consent
**Data Fiduciary validates consent before processing data**

```http
GET /api/v1/consents/validate?artifact_id=ART_5001&data_fiduciary_id=uuid&purpose_id=uuid
```

**Response:**
```json
{
  "success": true,
  "message": "Consent is valid",
  "data": {
    "is_valid": true,
    "status": "ACTIVE",
    "artifact_id": "ART_5001",
    "data_principal_id": "uuid",
    "purposes": [
      {
        "purpose_id": "uuid",
        "purpose_version_id": "uuid",
        "title": "Account Opening",
        "is_valid": true
      }
    ],
    "valid_till": "2025-12-31T23:59:59Z",
    "message": "Consent is active and valid"
  }
}
```

---

### 5. List Consents
**Get all consents for a data fiduciary**

```http
GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents
  ?status=ACTIVE
  &purpose_id=uuid
  &from_date=2024-01-01T00:00:00Z
  &to_date=2024-12-31T23:59:59Z
  &page=1
  &limit=10
  &sort_by=granted_at
  &sort_order=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Consents retrieved successfully",
  "data": {
    "data": [
      {
        "consent_artifact_id": "uuid",
        "data_fiduciary_id": "uuid",
        "data_principal_id": "uuid",
        "external_user_id": "user_123",
        "status": "ACTIVE",
        "purposes": [...],
        "granted_at": "2024-01-01T00:00:00Z",
        "expires_at": "2025-12-31T23:59:59Z",
        "consent_text_hash": "sha256_hash"
      }
    ],
    "meta": {
      "pagination": {
        "total": 100,
        "limit": 10,
        "current_page": 1,
        "total_pages": 10
      }
    }
  }
}
```

---

### 6. Get Consent by ID
**Get specific consent artifact**

```http
GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id
```

---

### 7. Withdraw Consent
**User withdraws consent**

```http
POST /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/withdraw
```

**Request Body:**
```json
{
  "reason": "No longer using the service",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent withdrawn successfully",
  "data": {
    "artifact_id": "uuid",
    "status": "WITHDRAWN",
    "withdrawn_at": "2024-06-01T00:00:00Z",
    "message": "Consent has been successfully withdrawn"
  }
}
```

**Webhook Notification:**
```json
{
  "event_type": "consent.withdrawn",
  "artifact_id": "uuid",
  "user_id": "external_user_id",
  "status": "WITHDRAWN",
  "withdrawn_at": "2024-06-01T00:00:00Z"
}
```

---

### 8. Get Consent History
**Get complete audit trail of consent**

```http
GET /api/v1/data-fiduciaries/:data_fiduciary_id/consents/:artifact_id/history?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Consent history retrieved successfully",
  "data": {
    "data": [
      {
        "consent_history_id": "uuid",
        "consent_artifact_id": "uuid",
        "action": "GRANT",
        "previous_status": "PENDING",
        "new_status": "ACTIVE",
        "performed_by": "data_principal_id",
        "performed_by_type": "principal",
        "performed_at": "2024-01-01T00:00:00Z",
        "notes": "Consent granted by data principal"
      }
    ],
    "meta": {
      "pagination": {...}
    }
  }
}
```

---

### 9. Get User Consents
**Get all consents for a specific user**

```http
GET /api/v1/data-fiduciaries/:data_fiduciary_id/users/:external_user_id/consents?status=ACTIVE
```

---

### 10. Bulk Validate Consents
**Validate multiple consents at once**

```http
POST /api/v1/consents/validate-bulk
```

**Request Body:**
```json
{
  "data_fiduciary_id": "uuid",
  "validations": [
    {
      "artifact_id": "uuid_1",
      "purpose_id": "uuid"
    },
    {
      "artifact_id": "uuid_2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk validation completed",
  "data": {
    "results": [
      {
        "artifact_id": "uuid_1",
        "is_valid": true,
        "status": "ACTIVE"
      },
      {
        "artifact_id": "uuid_2",
        "is_valid": false,
        "status": "EXPIRED"
      }
    ]
  }
}
```

---

## Webhook Configuration

### Setting up Webhooks

Data Fiduciaries must configure webhook URLs in their profile:

- `webhook_url`: The endpoint to receive notifications
- `webhook_secret`: Secret key for HMAC signature verification

### Webhook Security

All webhook requests include an `X-Webhook-Signature` header containing an HMAC-SHA256 signature of the payload.

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### Webhook Events

- `consent.granted` - User grants consent
- `consent.updated` - Consent is updated
- `consent.withdrawn` - User withdraws consent
- `consent.expired` - Consent has expired

### Webhook Retry Policy

- Failed webhooks are logged and pushed to Dead Letter Queue (DLQ)
- System maintains webhook logs with timestamps and response codes
- Failed webhooks can be manually retried

---

## Security Features

1. **TLS 1.3**: All API calls are secured with TLS 1.3
2. **HMAC Signatures**: Webhook payloads are signed
3. **AES-256 Encryption**: Data at rest is encrypted
4. **Audit Logs**: Complete audit trail with cryptographic hashes
5. **Tamper-Evident**: SHA-256 hash of consent artifacts

---

## Compliance

- **DPDP Act 2023** compliant
- **ISO 27001** aligned
- **Audit Logs**: Append-only audit logs for 7 years
- **Consent Artifacts**: Immutable consent records
- **Data Retention**: Configurable retention policies

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `410 Gone` - Resource expired
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- Default: 1000 requests per minute per fiduciary
- Daily limit: 100,000 requests
- Configurable per fiduciary

---

## Testing

### Example cURL Requests

**1. Initiate Consent:**
```bash
curl -X POST http://localhost:3000/api/v1/consents/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "data_fiduciary_id": "uuid",
    "user_id": "user_123",
    "purposes": ["purpose_uuid"],
    "language": "en"
  }'
```

**2. Get Consent Notice:**
```bash
curl http://localhost:3000/consents/:cms_request_id?language=en
```

**3. Submit Consent:**
```bash
curl -X POST http://localhost:3000/api/v1/consents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "cms_request_id": "uuid",
    "selected_purposes": ["purpose_uuid"],
    "agree": true
  }'
```

**4. Validate Consent:**
```bash
curl "http://localhost:3000/api/v1/consents/validate?artifact_id=ART_5001&data_fiduciary_id=uuid"
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dpdp
CMS_BASE_URL=http://localhost:3000
```

---

## Support

For issues or questions:
- Email: support@dpdp-cms.example.com
- Documentation: https://docs.dpdp-cms.example.com

