# User Journey Flows
## DPDP Consent Management System

**Version:** 1.0
**Last Updated:** November 26, 2025
**Compliance:** Digital Personal Data Protection Act, 2023

---

## Table of Contents

1. [Overview](#overview)
2. [Flow 1: Consent Capture](#flow-1-consent-capture)
3. [Flow 2: Consent Revocation/Withdrawal](#flow-2-consent-revocationwithdrawal)
4. [Flow 3: Child Data Management](#flow-3-child-data-management)
5. [Flow 4: Rights Requests (DPDP Act)](#flow-4-rights-requests-dpdp-act)
6. [Flow 5: Consent Renewal](#flow-5-consent-renewal)
7. [Flow 6: Data Breach Notification](#flow-6-data-breach-notification)
8. [Flow 7: Grievance Redressal](#flow-7-grievance-redressal)
9. [Flow 8: Data Portability](#flow-8-data-portability)
10. [Flow 9: Data Correction](#flow-9-data-correction)
11. [Flow 10: Account Deletion](#flow-10-account-deletion)
12. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

This document outlines the complete user journey flows for the DPDP Consent Management System, ensuring compliance with the Digital Personal Data Protection Act, 2023. Each flow includes:

- Visual flowcharts
- Step-by-step process descriptions
- API integration points
- UI/UX guidelines
- DPDP Act compliance checkpoints

### Key Actors

| Actor | Description |
|-------|-------------|
| **Data Principal** | The user whose personal data is being processed |
| **Data Fiduciary** | The organization collecting and processing data |
| **Parent/Guardian** | Legal guardian for users under 18 years |
| **System** | DPDP Consent Management System |
| **DPO** | Data Protection Officer of the organization |

---

## Flow 1: Consent Capture

### Overview
The consent capture flow ensures that users provide informed, clear, and specific consent for data processing activities as mandated by Section 6 of the DPDP Act.

### User Journey Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSENT CAPTURE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │   User   │
    │  Arrives │
    └────┬─────┘
         │
         ▼
    ┌─────────────────┐
    │ Age Verification │
    │   (Optional)     │
    └────┬────────┬────┘
         │        │
    ≥18yrs    <18yrs
         │        │
         │        ▼
         │   ┌──────────────────┐
         │   │ Parental Consent │
         │   │    Required      │
         │   └────────┬─────────┘
         │            │
         ▼            ▼
    ┌────────────────────────────┐
    │  Display Purpose Catalog   │
    │  • Marketing               │
    │  • Analytics               │
    │  • Personalization         │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  For Each Purpose:         │
    │  • Title                   │
    │  • Description             │
    │  • Data Fields             │
    │  • Retention Period        │
    │  • Legal Basis             │
    │  • Mandatory/Optional      │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │   User Selects Purposes    │
    │   ☑ Marketing              │
    │   ☑ Analytics              │
    │   ☐ Personalization        │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  Show Consent Summary      │
    │  • Selected purposes       │
    │  • Data to be collected    │
    │  • Rights information      │
    │  • Withdrawal process      │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │   Explicit Confirmation    │
    │   "I agree" button         │
    │   (Affirmative action)     │
    └────┬─────────────┬─────────┘
          │             │
       Agree         Decline
          │             │
          ▼             ▼
    ┌──────────┐   ┌──────────┐
    │  Create  │   │  Reject  │
    │ Consent  │   │ Consent  │
    │Artifacts │   │  & Exit  │
    └────┬─────┘   └──────────┘
         │
         ▼
    ┌──────────────────┐
    │  Send Email      │
    │  Confirmation    │
    └────┬─────────────┘
         │
         ▼
    ┌──────────────────┐
    │  Create Audit    │
    │  Log Entry       │
    └────┬─────────────┘
         │
         ▼
    ┌──────────────────┐
    │  Webhook to      │
    │  Fiduciary       │
    └────┬─────────────┘
         │
         ▼
    ┌──────────────────┐
    │  User Proceeds   │
    │  to Service      │
    └──────────────────┘
```

### Step-by-Step Process

#### Step 1: User Registration/Login

**Frontend:**
```typescript
// When user starts registration
async function initiateConsentCapture(userData: {
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: Date;
}) {
  // Check age if DOB provided
  const age = calculateAge(userData.dateOfBirth);

  if (age < 18) {
    return redirectToParentalConsent();
  }

  // Proceed to consent capture
  showConsentScreen();
}
```

#### Step 2: Fetch Available Purposes

**API Call:**
```typescript
const purposes = await fetch('/api/v1/purposes/active', {
  method: 'GET',
  headers: {
    'X-API-Key': API_KEY
  }
});

// Response includes:
// - purpose_id
// - title
// - description
// - data_fields (what data will be collected)
// - retention_period_days
// - is_mandatory
// - legal_basis
```

#### Step 3: Display Consent Interface

**UI Components:**

```html
<!-- Consent Purpose Card -->
<div class="consent-purpose-card">
  <div class="purpose-header">
    <input type="checkbox" id="purpose_marketing"
           value="pur_001"
           :disabled="purpose.is_mandatory">
    <label for="purpose_marketing">
      <h3>Email Marketing Communications</h3>
      <span class="badge" v-if="purpose.is_mandatory">Required</span>
      <span class="badge optional" v-else>Optional</span>
    </label>
  </div>

  <div class="purpose-body">
    <p class="description">
      We will send you promotional emails about our products,
      services, and special offers. You can unsubscribe at any time.
    </p>

    <div class="purpose-details">
      <h4>Data We Collect:</h4>
      <ul>
        <li>Email address</li>
        <li>Name</li>
        <li>Preferences</li>
      </ul>

      <h4>How We Use It:</h4>
      <ul>
        <li>Sending promotional emails</li>
        <li>List segmentation</li>
        <li>Campaign analytics</li>
      </ul>

      <h4>How Long We Keep It:</h4>
      <p>2 years from last interaction</p>

      <h4>Legal Basis:</h4>
      <p>Your explicit consent (DPDP Act Section 6)</p>
    </div>

    <button class="link-button" @click="showFullDetails">
      Read More Details
    </button>
  </div>
</div>
```

#### Step 4: User Selects Purposes

**Validation:**
```typescript
function validateConsentSelection(selectedPurposes: string[]) {
  const mandatoryPurposes = purposes.filter(p => p.is_mandatory);
  const mandatoryIds = mandatoryPurposes.map(p => p.purpose_id);

  // Ensure all mandatory purposes are selected
  const allMandatorySelected = mandatoryIds.every(
    id => selectedPurposes.includes(id)
  );

  if (!allMandatorySelected) {
    throw new Error('Please accept all required consents to continue');
  }

  return true;
}
```

#### Step 5: Show Consent Summary

```typescript
function showConsentSummary(selectedPurposes: Purpose[]) {
  return {
    purposes: selectedPurposes.map(p => ({
      title: p.title,
      data_fields: p.data_fields
    })),
    yourRights: [
      'Right to withdraw consent at any time',
      'Right to access your data',
      'Right to correct inaccurate data',
      'Right to data portability',
      'Right to erasure after withdrawal'
    ],
    howToWithdraw: 'Visit your account settings or email dpo@company.com',
    retentionPeriod: 'Data will be retained as specified for each purpose'
  };
}
```

#### Step 6: Create Consent

**API Call:**
```typescript
const consentResponse = await fetch('/api/v1/consent/create', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data_fiduciary_id: FIDUCIARY_ID,
    external_user_id: user.id,
    purpose_ids: selectedPurposes.map(p => p.purpose_id),
    consent_text: 'I agree to the above terms and conditions',
    user_data: {
      email: user.email,
      phone: user.phone,
      name: user.name
    },
    metadata: {
      ip_address: clientIP,
      user_agent: navigator.userAgent,
      consent_method: 'web_form',
      timestamp: new Date().toISOString(),
      consent_version: '1.0'
    }
  })
});

// Response:
// {
//   success: true,
//   data: {
//     consent_artifacts: [
//       { consent_artifact_id: 'ca_001', purpose_id: 'pur_001', status: 'ACTIVE' }
//     ],
//     data_principal_id: 'dp_xyz789'
//   }
// }
```

#### Step 7: Confirmation & Email

**Confirmation Email Template:**
```html
Subject: Consent Confirmation - [Company Name]

Dear [User Name],

Thank you for providing your consent. This email confirms your consent
preferences with [Company Name].

Consents Granted:
✓ Email Marketing Communications
✓ Product Analytics

Your Rights:
• You can withdraw your consent at any time
• You can access your data by logging into your account
• You can request data correction or deletion

How to Manage Your Consents:
Visit: https://yourcompany.com/account/consents
Or email: dpo@yourcompany.com

Consent Record ID: ca_abc123xyz
Date: November 26, 2025

Best regards,
[Company Name] Privacy Team
```

### DPDP Act Compliance Checkpoints

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Clear Purpose (Sec 6)** | Detailed purpose descriptions | ✅ |
| **Specific Consent** | Separate consent per purpose | ✅ |
| **Informed Consent** | Full disclosure of data use | ✅ |
| **Freely Given** | Optional purposes clearly marked | ✅ |
| **Affirmative Action** | Explicit "I agree" button | ✅ |
| **Easy Withdrawal** | Instructions provided upfront | ✅ |
| **Record Keeping** | Audit trail created | ✅ |

---

## Flow 2: Consent Revocation/Withdrawal

### Overview
Users have the right to withdraw consent at any time (Section 8 of DPDP Act). The system must make withdrawal as easy as granting consent.

### User Journey Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONSENT WITHDRAWAL FLOW                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User Logs In │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │ Navigate to      │
    │ Consent Settings │
    └──────┬───────────┘
           │
           ▼
    ┌─────────────────────────┐
    │ Display Active Consents │
    │ ┌─────────────────────┐ │
    │ │ ✓ Marketing         │ │
    │ │ ✓ Analytics         │ │
    │ │ ✓ Personalization   │ │
    │ └─────────────────────┘ │
    └──────┬──────────────────┘
           │
           ▼
    ┌─────────────────────────┐
    │ User Clicks "Withdraw"  │
    │ for a Specific Consent  │
    └──────┬──────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Show Impact Information     │
    │ • Service features affected │
    │ • Data retention details    │
    │ • Can re-consent later      │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Ask for Withdrawal Reason   │
    │ (Optional)                  │
    │ □ No longer interested      │
    │ □ Privacy concerns          │
    │ □ Too many communications   │
    │ □ Other: ___________        │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Confirm Withdrawal          │
    │ "Are you sure?"             │
    └──────┬────────────┬─────────┘
           │            │
       Confirm       Cancel
           │            │
           ▼            ▼
    ┌──────────┐   ┌────────┐
    │ Process  │   │ Return │
    │Withdrawal│   │  Back  │
    └────┬─────┘   └────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Update Consent Status    │
    │ Status: WITHDRAWN        │
    │ withdrawn_at: timestamp  │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Create Audit Log         │
    │ Action: WITHDRAW         │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Stop Data Processing     │
    │ Immediately              │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Notify Fiduciary         │
    │ (Webhook)                │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Send Confirmation Email  │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Schedule Data Deletion   │
    │ (After Retention Period) │
    └────┬─────────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Show Success Message     │
    │ • Consent withdrawn      │
    │ • Data deletion timeline │
    └──────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Access Consent Dashboard

**UI - Consent Management Page:**
```html
<div class="consent-dashboard">
  <h1>Your Consent Preferences</h1>
  <p>Manage how we use your data. You can withdraw consent at any time.</p>

  <div class="consent-list">
    <div v-for="consent in activeConsents" class="consent-item">
      <div class="consent-info">
        <h3>{{ consent.purpose.title }}</h3>
        <p>{{ consent.purpose.description }}</p>

        <div class="consent-meta">
          <span class="granted-date">
            Granted: {{ formatDate(consent.granted_at) }}
          </span>
          <span class="expires-date">
            Expires: {{ formatDate(consent.expires_at) }}
          </span>
        </div>

        <div class="data-collected">
          <strong>Data We Collect:</strong>
          <span v-for="field in consent.purpose.data_fields">
            {{ field }}
          </span>
        </div>
      </div>

      <div class="consent-actions">
        <button class="btn-danger" @click="initiateWithdrawal(consent)">
          Withdraw Consent
        </button>
        <button class="btn-link" @click="downloadConsentRecord(consent)">
          Download Record
        </button>
      </div>
    </div>
  </div>
</div>
```

#### Step 2: Initiate Withdrawal

```typescript
async function initiateWithdrawal(consent: ConsentArtifact) {
  // Show impact modal
  const impact = await fetchWithdrawalImpact(consent.purpose_id);

  const confirmed = await showConfirmationDialog({
    title: 'Withdraw Consent?',
    message: `
      You are about to withdraw consent for: ${consent.purpose.title}

      This means:
      ${impact.effects.map(e => `• ${e}`).join('\n')}

      Your data will be:
      • Stopped from further processing immediately
      • Retained for ${impact.retention_days} days as per legal requirements
      • Permanently deleted after retention period

      You can grant consent again at any time.
    `,
    confirmText: 'Yes, Withdraw',
    cancelText: 'Cancel'
  });

  if (confirmed) {
    const reason = await askWithdrawalReason();
    await processWithdrawal(consent.consent_artifact_id, reason);
  }
}
```

#### Step 3: Process Withdrawal

**API Call:**
```typescript
async function processWithdrawal(
  consentArtifactId: string,
  reason?: string
) {
  const response = await fetch('/api/v1/consent/withdraw', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consent_artifact_id: consentArtifactId,
      reason: reason || 'User requested withdrawal',
      initiated_by: 'USER'
    })
  });

  const result = await response.json();

  if (result.success) {
    showSuccessMessage('Consent withdrawn successfully');

    // Refresh consent list
    await loadUserConsents();

    // Show data deletion timeline
    showDataDeletionInfo(result.data.retention_period);
  }
}
```

#### Step 4: Backend Processing

**Backend Service:**
```typescript
// src/modules/consent/services/consent.service.ts

export async function withdrawConsent(input: {
  consent_artifact_id: string;
  reason?: string;
  initiated_by: 'USER' | 'SYSTEM' | 'FIDUCIARY';
}) {
  const artifact = await prisma.consentArtifact.findUnique({
    where: { consent_artifact_id: input.consent_artifact_id },
    include: {
      principal: true,
      purpose_version: { include: { purpose: true } }
    }
  });

  if (!artifact) {
    throw new AppError('Consent not found', 404);
  }

  if (artifact.status === 'WITHDRAWN') {
    throw new AppError('Consent already withdrawn', 400);
  }

  // Update consent status
  const updated = await prisma.consentArtifact.update({
    where: { consent_artifact_id: input.consent_artifact_id },
    data: {
      status: 'WITHDRAWN',
      withdrawn_at: new Date(),
      metadata: {
        ...artifact.metadata,
        withdrawal_reason: input.reason,
        withdrawal_method: 'user_dashboard',
        withdrawn_by: input.initiated_by
      }
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      user_id: artifact.data_principal_id,
      consent_artifact_id: artifact.consent_artifact_id,
      action: 'UPDATE',
      consent_status: 'WITHDRAWN',
      initiator: input.initiated_by,
      audit_hash: generateAuditHash({
        action: 'CONSENT_WITHDRAWN',
        artifact_id: artifact.consent_artifact_id,
        timestamp: new Date()
      }),
      details: {
        reason: input.reason,
        previous_status: artifact.status
      }
    }
  });

  // Immediately stop data processing
  await stopDataProcessing({
    principal_id: artifact.data_principal_id,
    purpose_id: artifact.purpose_id
  });

  // Send webhook to fiduciary
  await sendWebhook({
    event_type: 'consent.withdrawn',
    data: {
      consent_artifact_id: artifact.consent_artifact_id,
      data_principal_id: artifact.data_principal_id,
      external_user_id: artifact.principal.external_id,
      purpose_id: artifact.purpose_id,
      withdrawn_at: updated.withdrawn_at,
      reason: input.reason
    }
  });

  // Send confirmation email to user
  await sendWithdrawalConfirmationEmail({
    email: artifact.principal.email!,
    purpose_title: artifact.purpose_version.purpose.title,
    retention_days: artifact.purpose_version.purpose.retention_period_days
  });

  // Schedule data deletion
  const deletionDate = new Date();
  deletionDate.setDate(
    deletionDate.getDate() +
    (artifact.purpose_version.purpose.retention_period_days || 90)
  );

  await scheduleDataDeletion({
    principal_id: artifact.data_principal_id,
    purpose_id: artifact.purpose_id,
    deletion_date: deletionDate
  });

  return {
    success: true,
    message: 'Consent withdrawn successfully',
    data: {
      consent_artifact_id: artifact.consent_artifact_id,
      status: 'WITHDRAWN',
      withdrawn_at: updated.withdrawn_at,
      retention_period: artifact.purpose_version.purpose.retention_period_days,
      data_deletion_date: deletionDate
    }
  };
}
```

#### Step 5: Confirmation Email

```html
Subject: Consent Withdrawal Confirmation

Dear [User Name],

This confirms that your consent for "[Purpose Title]" has been
successfully withdrawn.

What This Means:
• We will immediately stop processing your data for this purpose
• You will no longer receive communications related to this purpose
• Your data will be retained for [X] days as per legal requirements
• After that, your data will be permanently deleted

Data Deletion Timeline:
• Withdrawal Date: November 26, 2025
• Retention Period: 90 days
• Scheduled Deletion: February 24, 2026

Your Rights:
• You can grant consent again at any time
• You can request immediate deletion by contacting us
• You can download your data before deletion

Questions?
Contact our Data Protection Officer: dpo@company.com

Withdrawal Record ID: ca_abc123xyz
Withdrawal Date: November 26, 2025, 3:45 PM IST
```

### DPDP Act Compliance Checkpoints

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Easy Withdrawal (Sec 8)** | One-click withdrawal process | ✅ |
| **Immediate Effect** | Processing stops immediately | ✅ |
| **Confirmation** | Email confirmation sent | ✅ |
| **Audit Trail** | Withdrawal logged | ✅ |
| **Data Retention** | Follows retention policy | ✅ |
| **Re-consent Option** | User can re-consent anytime | ✅ |

---

## Flow 3: Child Data Management

### Overview
Special protections for children under 18 years as per Section 9 of DPDP Act. Requires verifiable parental consent.

### User Journey Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  CHILD DATA MANAGEMENT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User Arrives │
    │ (Child <18)  │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────────┐
    │ Age Verification    │
    │ Date of Birth Entry │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────────────┐      ┌──────────────┐
    │  Age Check          │─────▶│  Age >= 18   │
    │  Calculate Age      │      │  Proceed     │
    └──────┬──────────────┘      │  Normally    │
           │                     └──────────────┘
      Age < 18
           │
           ▼
    ┌─────────────────────────────┐
    │ Display Parental Consent    │
    │ Requirement Notice          │
    │                             │
    │ "You must be 18 or older.   │
    │  Please have your parent or │
    │  guardian complete this."   │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Collect Parent Information  │
    │ • Parent Name               │
    │ • Parent Email              │
    │ • Parent Phone              │
    │ • Relationship              │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Send Verification Email     │
    │ to Parent                   │
    │ "Click to verify you are    │
    │  parent of [Child Name]"    │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Parent Receives Email       │
    │ with Verification Link      │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Parent Clicks Link          │
    │ Redirected to Consent Page  │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Parent Identity Verification│
    │ • OTP Verification          │
    │ • ID Proof Upload (Opt)     │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Display Child-Specific      │
    │ Consent Information         │
    │ • Purpose details           │
    │ • Data to be collected      │
    │ • How data will be used     │
    │ • Protection measures       │
    │ • Parent's rights           │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Parent Reviews & Confirms   │
    │ □ I am parent/guardian      │
    │ □ I understand the terms    │
    │ □ I consent on behalf of    │
    │   [Child Name]              │
    └──────┬────────────┬─────────┘
           │            │
        Accept      Decline
           │            │
           ▼            ▼
    ┌──────────┐   ┌──────────┐
    │ Create   │   │ Deny     │
    │ Consent  │   │ Access   │
    │ with     │   │ & Notify │
    │ Parental │   │ Child    │
    │ Flag     │   └──────────┘
    └────┬─────┘
         │
         ▼
    ┌─────────────────────────────┐
    │ Send Confirmation to        │
    │ Both Parent & Child         │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Create Special Audit Log    │
    │ • Parental consent granted  │
    │ • Parent details            │
    │ • Verification method       │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Enable Child Account        │
    │ with Restricted Access      │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Parent Dashboard Access     │
    │ • Monitor child's consents  │
    │ • Withdraw consent anytime  │
    │ • Download data             │
    │ • Delete account            │
    └──────────────────────────────┘

    ┌─────────────────────────────┐
    │ When Child Turns 18         │
    │ • Send notification         │
    │ • Request re-consent        │
    │ • Transfer control to adult │
    └─────────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Age Verification

**Frontend - Registration Form:**
```html
<form @submit="handleRegistration">
  <div class="form-group">
    <label for="dob">Date of Birth *</label>
    <input
      type="date"
      id="dob"
      v-model="userData.dateOfBirth"
      :max="maxDate"
      required
    />
    <small>You must be 18 years or older</small>
  </div>

  <div class="age-warning" v-if="isMinor">
    <p>⚠️ You must be 18 or older to create an account.</p>
    <p>If you are under 18, you will need parental consent.</p>
    <button type="button" @click="showParentalConsentForm">
      Continue with Parent/Guardian
    </button>
  </div>
</form>
```

**Age Calculation:**
```typescript
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function isMinor(dateOfBirth: Date): boolean {
  return calculateAge(dateOfBirth) < 18;
}
```

#### Step 2: Parental Consent Request

**API Endpoint:**
```typescript
// POST /api/v1/consent/request-parental-consent

export async function requestParentalConsent(input: {
  child_data: {
    name: string;
    email: string;
    date_of_birth: Date;
  };
  parent_data: {
    name: string;
    email: string;
    phone: string;
    relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  };
  purpose_ids: string[];
  data_fiduciary_id: string;
}) {
  // Verify child is actually a minor
  if (!isMinor(input.child_data.date_of_birth)) {
    throw new AppError('Parental consent not required for adults', 400);
  }

  // Create pending principal record
  const child = await prisma.dataPrincipal.create({
    data: {
      external_id: input.child_data.email,
      email: input.child_data.email,
      metadata: {
        date_of_birth: input.child_data.date_of_birth,
        is_minor: true,
        parental_consent_pending: true,
        parent_info: {
          name: input.parent_data.name,
          email: input.parent_data.email,
          phone: input.parent_data.phone,
          relationship: input.parent_data.relationship
        }
      }
    }
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store verification request
  await prisma.parentalConsentRequest.create({
    data: {
      request_id: crypto.randomUUID(),
      child_principal_id: child.data_principal_id,
      parent_email: input.parent_data.email,
      parent_name: input.parent_data.name,
      verification_token: await bcrypt.hash(verificationToken, 10),
      purpose_ids: input.purpose_ids,
      status: 'PENDING',
      expires_at: expiresAt
    }
  });

  // Send verification email to parent
  await sendParentalConsentEmail({
    parent_email: input.parent_data.email,
    parent_name: input.parent_data.name,
    child_name: input.child_data.name,
    verification_link: `${BASE_URL}/parental-consent/verify?token=${verificationToken}`,
    expires_at: expiresAt
  });

  return {
    success: true,
    message: 'Parental consent request sent',
    data: {
      child_principal_id: child.data_principal_id,
      parent_email: input.parent_data.email,
      expires_at: expiresAt
    }
  };
}
```

#### Step 3: Parent Verification Email

```html
Subject: Parental Consent Required - [Company Name]

Dear [Parent Name],

Your child, [Child Name], has attempted to create an account with
[Company Name]. As they are under 18 years of age, we require your
consent as their parent or legal guardian.

Child's Information:
• Name: [Child Name]
• Email: [Child Email]
• Date of Birth: [DOB]

What We Need Your Consent For:
[List of purposes]

Please review and provide consent by clicking the link below:
[Verify & Provide Consent Button]

This link will expire in 7 days.

Important Information:
• This consent is required under Indian DPDP Act, 2023
• You can withdraw consent at any time
• You will have full control over your child's data
• You can monitor and manage their privacy settings

Questions? Contact us at: dpo@company.com

Best regards,
[Company Name] Privacy Team

---
If you did not expect this email or have concerns about this request,
please contact us immediately at privacy@company.com
```

#### Step 4: Parent Consent Page

**Frontend - Parental Consent UI:**
```html
<div class="parental-consent-page">
  <div class="header">
    <h1>Parental Consent Verification</h1>
    <p>You are providing consent for: <strong>{{ childName }}</strong></p>
  </div>

  <!-- Parent Verification -->
  <div class="verification-section">
    <h2>Step 1: Verify Your Identity</h2>
    <p>We need to verify that you are the parent/guardian.</p>

    <div class="otp-verification">
      <label>Enter OTP sent to {{ maskedPhone }}</label>
      <input type="text" v-model="otp" maxlength="6" />
      <button @click="verifyOTP">Verify</button>
    </div>
  </div>

  <!-- Consent Details -->
  <div class="consent-details" v-if="otpVerified">
    <h2>Step 2: Review Consent Details</h2>

    <div class="warning-box">
      <p>⚠️ Important: You are providing consent on behalf of a minor.</p>
      <p>You will have full control and can withdraw this consent at any time.</p>
    </div>

    <div class="purposes-list">
      <div v-for="purpose in purposes" class="purpose-card">
        <h3>{{ purpose.title }}</h3>
        <p>{{ purpose.description }}</p>

        <div class="purpose-details">
          <h4>Data We Will Collect:</h4>
          <ul>
            <li v-for="field in purpose.data_fields">{{ field }}</li>
          </ul>

          <h4>How We Will Use It:</h4>
          <ul>
            <li v-for="activity in purpose.processing_activities">
              {{ activity }}
            </li>
          </ul>

          <h4>Child Safety Measures:</h4>
          <ul>
            <li>Enhanced encryption for minor's data</li>
            <li>Parental monitoring dashboard</li>
            <li>Age-appropriate content filters</li>
            <li>No targeted advertising</li>
            <li>No data sharing with third parties</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Your Rights -->
    <div class="rights-section">
      <h3>Your Rights as Parent/Guardian:</h3>
      <ul>
        <li>✓ Withdraw consent at any time</li>
        <li>✓ Access your child's data</li>
        <li>✓ Correct inaccurate information</li>
        <li>✓ Request data deletion</li>
        <li>✓ Monitor consent usage</li>
        <li>✓ Receive breach notifications</li>
      </ul>
    </div>

    <!-- Consent Form -->
    <div class="consent-form">
      <h2>Step 3: Provide Consent</h2>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" v-model="confirmations.isParent" required />
          I confirm that I am the parent or legal guardian of {{ childName }}
        </label>
      </div>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" v-model="confirmations.understand" required />
          I have read and understood how my child's data will be used
        </label>
      </div>

      <div class="checkbox-group">
        <label>
          <input type="checkbox" v-model="confirmations.consent" required />
          I provide consent for my child to use this service
        </label>
      </div>

      <div class="signature-section">
        <label>Full Name:</label>
        <input type="text" v-model="parentSignature" required />
        <small>By typing your name, you are providing your electronic signature</small>
      </div>

      <div class="action-buttons">
        <button class="btn-primary" @click="submitConsent"
                :disabled="!allConfirmed">
          Provide Consent
        </button>
        <button class="btn-secondary" @click="declineConsent">
          Decline
        </button>
      </div>
    </div>
  </div>
</div>
```

#### Step 5: Create Consent with Parental Flag

```typescript
// Backend: Process parental consent
export async function processParentalConsent(input: {
  verification_token: string;
  parent_signature: string;
  otp_verified: boolean;
  confirmations: {
    is_parent: boolean;
    understand: boolean;
    consent: boolean;
  };
}) {
  // Verify all confirmations
  if (!Object.values(input.confirmations).every(v => v)) {
    throw new AppError('All confirmations required', 400);
  }

  // Find consent request
  const request = await prisma.parentalConsentRequest.findFirst({
    where: {
      verification_token: input.verification_token,
      status: 'PENDING',
      expires_at: { gte: new Date() }
    },
    include: {
      child_principal: true
    }
  });

  if (!request) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Create consents for child with parental flag
  const consents = [];

  for (const purposeId of request.purpose_ids) {
    const purposeVersion = await prisma.purposeVersion.findFirst({
      where: { purpose_id: purposeId, is_current: true }
    });

    const consent = await prisma.consentArtifact.create({
      data: {
        data_fiduciary_id: request.data_fiduciary_id,
        data_principal_id: request.child_principal_id,
        purpose_id: purposeId,
        purpose_version_id: purposeVersion!.purpose_version_id,
        status: 'ACTIVE',
        granted_at: new Date(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        metadata: {
          is_minor_consent: true,
          parental_consent: {
            parent_name: request.parent_name,
            parent_email: request.parent_email,
            parent_signature: input.parent_signature,
            verification_method: 'email_otp',
            consented_at: new Date(),
            relationship: request.parent_relationship
          },
          enhanced_protection: true
        }
      }
    });

    consents.push(consent);
  }

  // Update consent request
  await prisma.parentalConsentRequest.update({
    where: { request_id: request.request_id },
    data: {
      status: 'APPROVED',
      approved_at: new Date()
    }
  });

  // Update child principal
  await prisma.dataPrincipal.update({
    where: { data_principal_id: request.child_principal_id },
    data: {
      metadata: {
        ...request.child_principal.metadata,
        parental_consent_pending: false,
        parental_consent_granted: true,
        parental_consent_date: new Date()
      }
    }
  });

  // Create special audit log
  await prisma.auditLog.create({
    data: {
      user_id: request.child_principal_id,
      action: 'CREATE',
      consent_status: 'ACTIVE',
      initiator: 'GUARDIAN',
      audit_hash: generateAuditHash({
        action: 'PARENTAL_CONSENT_GRANTED',
        artifact_id: consents[0].consent_artifact_id,
        timestamp: new Date()
      }),
      details: {
        parent_email: request.parent_email,
        parent_name: request.parent_name,
        verification_method: 'email_otp',
        child_dob: request.child_principal.metadata.date_of_birth
      }
    }
  });

  // Send confirmation to both parent and child
  await Promise.all([
    sendParentConfirmationEmail({
      parent_email: request.parent_email,
      parent_name: request.parent_name,
      child_name: request.child_principal.metadata.name
    }),
    sendChildWelcomeEmail({
      child_email: request.child_principal.email!,
      child_name: request.child_principal.metadata.name,
      parent_email: request.parent_email
    })
  ]);

  return {
    success: true,
    message: 'Parental consent granted successfully',
    data: {
      child_principal_id: request.child_principal_id,
      consent_artifacts: consents,
      parent_dashboard_url: `${BASE_URL}/parent-dashboard?child=${request.child_principal_id}`
    }
  };
}
```

#### Step 6: Parent Dashboard

```typescript
// Parent monitoring dashboard
export async function getParentDashboard(parentEmail: string) {
  const children = await prisma.dataPrincipal.findMany({
    where: {
      metadata: {
        path: ['parent_info', 'email'],
        equals: parentEmail
      },
      is_deleted: false
    },
    include: {
      consents: {
        where: { is_deleted: false },
        include: {
          purpose_version: {
            include: { purpose: true }
          }
        }
      }
    }
  });

  return {
    children: children.map(child => ({
      name: child.metadata.name,
      email: child.email,
      age: calculateAge(child.metadata.date_of_birth),
      active_consents: child.consents.filter(c => c.status === 'ACTIVE').length,
      total_consents: child.consents.length,
      consents: child.consents.map(consent => ({
        purpose: consent.purpose_version.purpose.title,
        status: consent.status,
        granted_at: consent.granted_at,
        can_withdraw: consent.status === 'ACTIVE'
      })),
      actions: {
        withdraw_all: `/api/v1/parent/withdraw-all-consents/${child.data_principal_id}`,
        download_data: `/api/v1/parent/download-data/${child.data_principal_id}`,
        delete_account: `/api/v1/parent/delete-account/${child.data_principal_id}`
      }
    }))
  };
}
```

#### Step 7: Age Transition (Child Turns 18)

```typescript
// Scheduled job to check for age transitions
export async function handleAgeTransitions() {
  const today = new Date();

  // Find principals who turned 18 today
  const transitioning = await prisma.dataPrincipal.findMany({
    where: {
      metadata: {
        path: ['is_minor'],
        equals: true
      },
      is_deleted: false
    }
  });

  for (const principal of transitioning) {
    const dob = new Date(principal.metadata.date_of_birth);
    const age = calculateAge(dob);

    if (age >= 18) {
      // Update principal status
      await prisma.dataPrincipal.update({
        where: { data_principal_id: principal.data_principal_id },
        data: {
          metadata: {
            ...principal.metadata,
            is_minor: false,
            became_adult_on: today,
            requires_re_consent: true
          }
        }
      });

      // Send notification to request re-consent as adult
      await sendAgeTransitionEmail({
        email: principal.email!,
        name: principal.metadata.name,
        message: `
          Happy Birthday! 🎉

          You're now 18 years old. You now have full control over your account
          and privacy settings.

          Please review and re-confirm your consents:
          [Review Consents Button]

          Your previous consents granted by your parent/guardian will remain
          active for 30 days. After that, you'll need to provide your own consent.
        `
      });

      // Notify parent
      await sendParentNotification({
        parent_email: principal.metadata.parent_info.email,
        message: `
          Your child ${principal.metadata.name} has turned 18.
          They now have full control of their account.
          Your parental access will be removed in 30 days.
        `
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          user_id: principal.data_principal_id,
          action: 'SYSTEM',
          initiator: 'SYSTEM',
          details: {
            event: 'age_transition',
            from_minor_to_adult: true,
            birthday: today
          }
        }
      });
    }
  }
}
```

### DPDP Act Compliance Checkpoints

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Parental Consent (Sec 9)** | Verifiable parental consent required | ✅ |
| **Parent Verification** | OTP + Email verification | ✅ |
| **Enhanced Protection** | Special safeguards for minors | ✅ |
| **Parental Control** | Parent dashboard with full control | ✅ |
| **Age Transition** | Automatic handling at age 18 | ✅ |
| **Audit Trail** | Special logging for minor consents | ✅ |
| **No Profiling** | No behavioral tracking for minors | ✅ |

---

## Flow 4: Rights Requests (DPDP Act)

### Overview
Data principals have specific rights under the DPDP Act. This flow handles all rights requests.

### Rights Under DPDP Act

| Right | Section | Description |
|-------|---------|-------------|
| **Right to Access** | Section 11 | Obtain copy of personal data |
| **Right to Correction** | Section 12 | Correct inaccurate data |
| **Right to Erasure** | Section 13 | Delete personal data |
| **Right to Grievance Redressal** | Section 14 | File complaints |
| **Right to Nominate** | Section 15 | Nominate representative |

### User Journey Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     RIGHTS REQUEST FLOW                          │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User Logs In │
    └──────┬───────┘
           │
           ▼
    ┌────────────────────┐
    │ Navigate to        │
    │ "Your Rights"      │
    │ Section            │
    └──────┬─────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Display Available Rights   │
    │ ┌────────────────────────┐ │
    │ │ 📥 Access Your Data    │ │
    │ │ ✏️  Correct Your Data   │ │
    │ │ 🗑️  Delete Your Data    │ │
    │ │ 📤 Port Your Data      │ │
    │ │ ⚠️  File Grievance     │ │
    │ └────────────────────────┘ │
    └──────┬─────────────────────┘
           │
           ▼
    ┌────────────────────┐
    │ User Selects       │
    │ a Right            │
    └──────┬─────────────┘
           │
    ┌──────┴──────┬──────────┬─────────┬─────────┐
    │             │          │         │         │
    ▼             ▼          ▼         ▼         ▼
[Access]    [Correction] [Erasure] [Portability] [Grievance]
    │             │          │         │         │
    │             │          │         │         │
    ▼             ▼          ▼         ▼         ▼
[Different flows below...]
```

### 4.1 Right to Access (Data Download)

```
    ┌──────────────────┐
    │ Request Data     │
    │ Download         │
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Select Data Categories │
    │ □ Profile Information  │
    │ □ Consent History      │
    │ □ Activity Logs        │
    │ □ All Data             │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Select Format          │
    │ ○ JSON                 │
    │ ○ CSV                  │
    │ ○ PDF Report           │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Verify Identity        │
    │ (OTP/Password)         │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Create Data Package    │
    │ • Collect all data     │
    │ • Generate report      │
    │ • Create secure link   │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Send Email with        │
    │ Download Link          │
    │ (Expires in 7 days)    │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ User Downloads Data    │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Log Access Request     │
    │ in Audit Trail         │
    └────────────────────────┘
```

**Implementation:**

```typescript
// Request data download
export async function requestDataDownload(input: {
  data_principal_id: string;
  categories: string[];
  format: 'JSON' | 'CSV' | 'PDF';
}) {
  // Collect all user data
  const principal = await prisma.dataPrincipal.findUnique({
    where: { data_principal_id: input.data_principal_id },
    include: {
      consents: {
        include: {
          purpose_version: { include: { purpose: true } },
          history: true
        }
      },
      auditLogs: true,
      grievances: true
    }
  });

  if (!principal) {
    throw new AppError('User not found', 404);
  }

  // Generate data package
  const dataPackage = {
    generated_at: new Date(),
    data_principal_id: principal.data_principal_id,
    personal_information: {
      email: principal.email,
      phone: principal.phone,
      language: principal.language,
      created_at: principal.created_at,
      last_login: principal.last_login
    },
    consents: principal.consents.map(consent => ({
      purpose: consent.purpose_version.purpose.title,
      status: consent.status,
      granted_at: consent.granted_at,
      expires_at: consent.expires_at,
      withdrawn_at: consent.withdrawn_at,
      history: consent.history
    })),
    audit_trail: principal.auditLogs.map(log => ({
      action: log.action,
      timestamp: log.timestamp,
      details: log.details
    })),
    grievances: principal.grievances
  };

  // Create secure download link
  const downloadToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.dataDownloadRequest.create({
    data: {
      request_id: crypto.randomUUID(),
      data_principal_id: principal.data_principal_id,
      download_token: await bcrypt.hash(downloadToken, 10),
      data_package: dataPackage,
      format: input.format,
      status: 'READY',
      expires_at: expiresAt
    }
  });

  const downloadLink = `${BASE_URL}/download-data?token=${downloadToken}`;

  // Send email
  await sendDataDownloadEmail({
    email: principal.email!,
    download_link: downloadLink,
    expires_at: expiresAt
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      user_id: principal.data_principal_id,
      action: 'SYSTEM',
      initiator: 'USER',
      details: {
        event: 'data_access_request',
        categories: input.categories,
        format: input.format
      }
    }
  });

  return {
    success: true,
    message: 'Data download link sent to your email',
    expires_at: expiresAt
  };
}
```

### 4.2 Right to Correction

```
    ┌──────────────────┐
    │ Request Data     │
    │ Correction       │
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Display Current Data   │
    │ Email: user@email.com  │
    │ Phone: +91-9876543210  │
    │ Name: John Doe         │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ User Edits Data        │
    │ Marks Incorrect Fields │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Provide Correct Info   │
    │ & Supporting Docs      │
    │ (Optional)             │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Submit Correction      │
    │ Request                │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ DPO Reviews Request    │
    │ (Auto-approve simple   │
    │  changes)              │
    └──────┬────────┬────────┘
           │        │
       Approve  More Info
           │        │
           ▼        ▼
    ┌──────────┐ ┌──────────┐
    │ Update   │ │ Request  │
    │ Data     │ │ More     │
    │          │ │ Details  │
    └────┬─────┘ └────┬─────┘
         │            │
         ▼            │
    ┌──────────────┐ │
    │ Notify User  │◄┘
    └──────────────┘
```

**Implementation:**

```typescript
export async function requestDataCorrection(input: {
  data_principal_id: string;
  corrections: {
    field: string;
    current_value: string;
    corrected_value: string;
    reason: string;
    supporting_documents?: string[];
  }[];
}) {
  // Create correction request
  const request = await prisma.dataCorrectionRequest.create({
    data: {
      request_id: crypto.randomUUID(),
      data_principal_id: input.data_principal_id,
      corrections: input.corrections,
      status: 'PENDING',
      submitted_at: new Date()
    }
  });

  // Auto-approve simple changes (email, phone with verification)
  const simpleFields = ['email', 'phone', 'name'];
  const allSimple = input.corrections.every(c =>
    simpleFields.includes(c.field)
  );

  if (allSimple) {
    // Send verification OTP
    await sendVerificationForCorrection(request.request_id);
  } else {
    // Notify DPO for manual review
    await notifyDPOForReview(request.request_id);
  }

  return {
    success: true,
    message: 'Correction request submitted',
    request_id: request.request_id,
    status: allSimple ? 'VERIFICATION_REQUIRED' : 'UNDER_REVIEW'
  };
}
```

### 4.3 Right to Erasure

```
    ┌──────────────────┐
    │ Request Account  │
    │ Deletion         │
    └──────┬───────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Show Impact Warning    │
    │ • All data will be     │
    │   deleted              │
    │ • Cannot be undone     │
    │ • Service access lost  │
    │ • 30-day grace period  │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Verify Identity        │
    │ (Password + OTP)       │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │ Final Confirmation     │
    │ Type "DELETE" to       │
    │ confirm                │
    └──────┬────────┬────────┘
           │        │
       Confirm   Cancel
           │        │
           ▼        │
    ┌──────────┐   │
    │ Schedule │   │
    │ Deletion │   │
    │ (30 days)│   │
    └────┬─────┘   │
         │         │
         ▼         │
    ┌──────────┐  │
    │ Withdraw │  │
    │ All      │  │
    │ Consents │  │
    └────┬─────┘  │
         │        │
         ▼        │
    ┌──────────┐ │
    │ Send     │ │
    │ Email    │ │
    │ with     │ │
    │ Cancel   │ │
    │ Link     │ │
    └────┬─────┘ │
         │       │
         ▼       ▼
    [Grace Period]
         │
         ▼
    ┌──────────┐
    │ After    │
    │ 30 days: │
    │ Delete   │
    │ All Data │
    └──────────┘
```

**Implementation:**

```typescript
export async function requestAccountDeletion(input: {
  data_principal_id: string;
  reason?: string;
  immediate: boolean;
}) {
  const principal = await prisma.dataPrincipal.findUnique({
    where: { data_principal_id: input.data_principal_id },
    include: { consents: true }
  });

  if (!principal) {
    throw new AppError('User not found', 404);
  }

  const gracePeriodDays = input.immediate ? 0 : 30;
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + gracePeriodDays);

  // Withdraw all active consents
  await prisma.consentArtifact.updateMany({
    where: {
      data_principal_id: principal.data_principal_id,
      status: 'ACTIVE'
    },
    data: {
      status: 'WITHDRAWN',
      withdrawn_at: new Date()
    }
  });

  // Schedule deletion
  await prisma.accountDeletionRequest.create({
    data: {
      request_id: crypto.randomUUID(),
      data_principal_id: principal.data_principal_id,
      requested_at: new Date(),
      scheduled_deletion_date: deletionDate,
      reason: input.reason,
      status: 'SCHEDULED',
      cancellation_token: crypto.randomBytes(32).toString('hex')
    }
  });

  // Send confirmation email
  await sendDeletionConfirmationEmail({
    email: principal.email!,
    deletion_date: deletionDate,
    cancel_link: `${BASE_URL}/cancel-deletion?token=...`
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      user_id: principal.data_principal_id,
      action: 'DELETE',
      initiator: 'USER',
      details: {
        event: 'account_deletion_requested',
        grace_period_days: gracePeriodDays,
        scheduled_date: deletionDate
      }
    }
  });

  return {
    success: true,
    message: gracePeriodDays > 0
      ? `Account deletion scheduled for ${deletionDate.toLocaleDateString()}`
      : 'Account will be deleted immediately',
    deletion_date: deletionDate,
    can_cancel: gracePeriodDays > 0
  };
}
```

---

## Flow 5: Consent Renewal

*[Continued in similar detailed format...]*

---

## Implementation Guidelines

### UI/UX Best Practices

1. **Clear Language**: Use simple, jargon-free language
2. **Visual Hierarchy**: Important information first
3. **Progressive Disclosure**: Don't overwhelm users
4. **Mobile-First**: Optimize for mobile devices
5. **Accessibility**: WCAG 2.1 AA compliance

### Technical Requirements

1. **Response Time**: < 2 seconds for all operations
2. **Email Delivery**: < 1 minute for all notifications
3. **Data Download**: Ready within 24 hours
4. **Audit Logging**: All actions logged immediately

### Compliance Checklist

- [ ] All flows comply with DPDP Act sections
- [ ] Audit trails for all operations
- [ ] Email confirmations sent
- [ ] Parent verification for minors
- [ ] Grace periods implemented
- [ ] User rights easily accessible
- [ ] Data encryption in transit and at rest

---

**End of User Journey Flows Documentation**

