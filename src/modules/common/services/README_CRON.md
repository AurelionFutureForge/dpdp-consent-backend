# CRON Service - Quick Reference

## 🚀 Quick Start

The CRON service automatically initializes when the server starts. No manual setup required!

## 📅 Scheduled Jobs

| Job Name | Schedule | Time | Description |
|----------|----------|------|-------------|
| **Consent Expiry Reminders** | `0 1 * * *` | 1:00 AM daily | Sends email reminders for consents expiring soon |
| **Expire Old Consents** | `0 2 * * *` | 2:00 AM daily | Marks expired consents and sends notifications |

## ⚙️ Environment Variables

```env
# Add to your .env file
CONSENT_EXPIRY_REMINDER_DAYS=7    # Days before expiry to send reminder
CRON_TIMEZONE=Asia/Kolkata        # Timezone for scheduling
```

## 🧪 Testing

### Get CRON Status
```bash
curl http://localhost:8001/api/v1/admin/cron/status
```

### Manually Trigger Expiry Reminders
```bash
curl -X POST http://localhost:8001/api/v1/admin/cron/trigger-expiry-reminders
```

### Manually Trigger Consent Expiration
```bash
curl -X POST http://localhost:8001/api/v1/admin/cron/trigger-expire-consents
```

## 📝 Functions

### `sendConsentExpiryReminders()`
Finds and sends reminders for consents expiring within configured days.

### `expireOldConsents()`
Marks past-due consents as EXPIRED and creates history records.

### `initializeCronJobs()`
Initializes all scheduled jobs (called automatically on server start).

### `triggerConsentExpiryReminders()`
Manual trigger for testing (returns stats).

## 🔍 Monitoring

Check server logs for:
```
🔔 [CRON] Starting consent expiry reminder job
📊 [CRON] Found 15 consents expiring within 7 days
✅ [CRON] Consent expiry reminder job completed
```

## 📚 Full Documentation

See [CRON_JOBS_DOCUMENTATION.md](../../../CRON_JOBS_DOCUMENTATION.md) for complete details.
