-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsentAction" AS ENUM ('GRANT', 'UPDATE', 'WITHDRAW', 'EXPIRE', 'VALIDATE');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'NOTIFY', 'LOGIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DPO', 'AUDITOR', 'SYSTEM');

-- CreateTable
CREATE TABLE "DataPrincipal" (
    "data_principal_id" TEXT NOT NULL,
    "external_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DataPrincipal_pkey" PRIMARY KEY ("data_principal_id")
);

-- CreateTable
CREATE TABLE "DataFiduciary" (
    "data_fiduciary_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "registration_number" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "dpo_email" TEXT,
    "dpo_phone" TEXT,
    "website_url" TEXT,
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT NOT NULL,
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "callback_url" TEXT,
    "rate_limit_per_min" INTEGER NOT NULL DEFAULT 1000,
    "rate_limit_per_day" INTEGER NOT NULL DEFAULT 100000,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "privacy_policy_url" TEXT,
    "terms_url" TEXT,
    "gdpr_compliant" BOOLEAN NOT NULL DEFAULT false,
    "dpdp_compliant" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_api_call" TIMESTAMP(3),

    CONSTRAINT "DataFiduciary_pkey" PRIMARY KEY ("data_fiduciary_id")
);

-- CreateTable
CREATE TABLE "PrincipalFiduciaryMap" (
    "principal_fiduciary_map_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "principal_id" TEXT NOT NULL,
    "external_ref" TEXT NOT NULL,

    CONSTRAINT "PrincipalFiduciaryMap_pkey" PRIMARY KEY ("principal_fiduciary_map_id")
);

-- CreateTable
CREATE TABLE "purpose_categories" (
    "purpose_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purpose_categories_pkey" PRIMARY KEY ("purpose_category_id")
);

-- CreateTable
CREATE TABLE "Purpose" (
    "purpose_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "purpose_category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "legal_basis" TEXT,
    "data_fields" TEXT[],
    "processing_activities" TEXT[],
    "retention_period_days" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_renewal" BOOLEAN NOT NULL DEFAULT false,
    "renewal_period_days" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purpose_pkey" PRIMARY KEY ("purpose_id")
);

-- CreateTable
CREATE TABLE "PurposeVersion" (
    "purpose_version_id" TEXT NOT NULL,
    "purpose_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language_code" TEXT DEFAULT 'en',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deprecated_at" TIMESTAMP(3),

    CONSTRAINT "PurposeVersion_pkey" PRIMARY KEY ("purpose_version_id")
);

-- CreateTable
CREATE TABLE "PurposeTranslation" (
    "purpose_translation_id" TEXT NOT NULL,
    "purpose_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PurposeTranslation_pkey" PRIMARY KEY ("purpose_translation_id")
);

-- CreateTable
CREATE TABLE "ConsentArtifact" (
    "consent_artifact_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "data_principal_id" TEXT NOT NULL,
    "purpose_id" TEXT NOT NULL,
    "purpose_version_id" TEXT NOT NULL,
    "principal_fiduciary_map_id" TEXT,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "last_validated_at" TIMESTAMP(3),
    "metadata" JSONB,
    "consent_text_hash" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ConsentArtifact_pkey" PRIMARY KEY ("consent_artifact_id")
);

-- CreateTable
CREATE TABLE "ConsentHistory" (
    "consent_history_id" TEXT NOT NULL,
    "consent_artifact_id" TEXT NOT NULL,
    "action" "ConsentAction" NOT NULL,
    "previous_status" "ConsentStatus",
    "new_status" "ConsentStatus",
    "performed_by" TEXT,
    "performed_by_type" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ConsentHistory_pkey" PRIMARY KEY ("consent_history_id")
);

-- CreateTable
CREATE TABLE "ConsentValidation" (
    "consent_validation_id" TEXT NOT NULL,
    "consent_artifact_id" TEXT NOT NULL,
    "requested_by" TEXT,
    "purpose_requested" TEXT,
    "is_valid" BOOLEAN NOT NULL,
    "response_time_ms" INTEGER,
    "cache_hit" BOOLEAN NOT NULL DEFAULT false,
    "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_by" TEXT,
    "remarks" TEXT,

    CONSTRAINT "ConsentValidation_pkey" PRIMARY KEY ("consent_validation_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "status" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "alert_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "consent_artifact_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "ProcessorAck" (
    "processor_ack_id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" JSONB,

    CONSTRAINT "ProcessorAck_pkey" PRIMARY KEY ("processor_ack_id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "webhook_log_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "status_code" INTEGER,
    "response_body" TEXT,
    "response_time_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("webhook_log_id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "grievance_id" TEXT NOT NULL,
    "data_principal_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("grievance_id")
);

-- CreateTable
CREATE TABLE "GrievanceAction" (
    "grievance_action_id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "notes" TEXT,
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceAction_pkey" PRIMARY KEY ("grievance_action_id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "retention_policy_id" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("retention_policy_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "audit_log_id" TEXT NOT NULL,
    "user_id" TEXT,
    "purpose_id" TEXT,
    "consent_artifact_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consent_status" "ConsentStatus",
    "initiator" TEXT,
    "source_ip" TEXT,
    "audit_hash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "DataProtectionOfficer" (
    "dpo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "data_fiduciary_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataProtectionOfficer_pkey" PRIMARY KEY ("dpo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataPrincipal_external_id_key" ON "DataPrincipal"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "DataPrincipal_email_key" ON "DataPrincipal"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DataPrincipal_phone_key" ON "DataPrincipal"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "DataFiduciary_registration_number_key" ON "DataFiduciary"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "DataFiduciary_api_key_key" ON "DataFiduciary"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "PrincipalFiduciaryMap_data_fiduciary_id_external_ref_key" ON "PrincipalFiduciaryMap"("data_fiduciary_id", "external_ref");

-- CreateIndex
CREATE UNIQUE INDEX "purpose_categories_name_key" ON "purpose_categories"("name");

-- CreateIndex
CREATE INDEX "purpose_categories_is_active_display_order_idx" ON "purpose_categories"("is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "PurposeVersion_purpose_id_version_number_key" ON "PurposeVersion"("purpose_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "PurposeTranslation_purpose_id_language_code_key" ON "PurposeTranslation"("purpose_id", "language_code");

-- CreateIndex
CREATE INDEX "ConsentArtifact_data_fiduciary_id_data_principal_id_purpose_idx" ON "ConsentArtifact"("data_fiduciary_id", "data_principal_id", "purpose_id");

-- CreateIndex
CREATE INDEX "webhook_logs_data_fiduciary_id_idx" ON "webhook_logs"("data_fiduciary_id");

-- CreateIndex
CREATE INDEX "webhook_logs_created_at_idx" ON "webhook_logs"("created_at");

-- CreateIndex
CREATE INDEX "webhook_logs_success_idx" ON "webhook_logs"("success");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DataProtectionOfficer_email_key" ON "DataProtectionOfficer"("email");

-- AddForeignKey
ALTER TABLE "PrincipalFiduciaryMap" ADD CONSTRAINT "PrincipalFiduciaryMap_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrincipalFiduciaryMap" ADD CONSTRAINT "PrincipalFiduciaryMap_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "DataPrincipal"("data_principal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_purpose_category_id_fkey" FOREIGN KEY ("purpose_category_id") REFERENCES "purpose_categories"("purpose_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurposeVersion" ADD CONSTRAINT "PurposeVersion_purpose_id_fkey" FOREIGN KEY ("purpose_id") REFERENCES "Purpose"("purpose_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurposeTranslation" ADD CONSTRAINT "PurposeTranslation_purpose_id_fkey" FOREIGN KEY ("purpose_id") REFERENCES "Purpose"("purpose_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentArtifact" ADD CONSTRAINT "ConsentArtifact_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentArtifact" ADD CONSTRAINT "ConsentArtifact_data_principal_id_fkey" FOREIGN KEY ("data_principal_id") REFERENCES "DataPrincipal"("data_principal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentArtifact" ADD CONSTRAINT "ConsentArtifact_purpose_version_id_fkey" FOREIGN KEY ("purpose_version_id") REFERENCES "PurposeVersion"("purpose_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentArtifact" ADD CONSTRAINT "ConsentArtifact_principal_fiduciary_map_id_fkey" FOREIGN KEY ("principal_fiduciary_map_id") REFERENCES "PrincipalFiduciaryMap"("principal_fiduciary_map_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentHistory" ADD CONSTRAINT "ConsentHistory_consent_artifact_id_fkey" FOREIGN KEY ("consent_artifact_id") REFERENCES "ConsentArtifact"("consent_artifact_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentValidation" ADD CONSTRAINT "ConsentValidation_consent_artifact_id_fkey" FOREIGN KEY ("consent_artifact_id") REFERENCES "ConsentArtifact"("consent_artifact_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_consent_artifact_id_fkey" FOREIGN KEY ("consent_artifact_id") REFERENCES "ConsentArtifact"("consent_artifact_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessorAck" ADD CONSTRAINT "ProcessorAck_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "Alert"("alert_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_data_principal_id_fkey" FOREIGN KEY ("data_principal_id") REFERENCES "DataPrincipal"("data_principal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceAction" ADD CONSTRAINT "GrievanceAction_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "Grievance"("grievance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionPolicy" ADD CONSTRAINT "RetentionPolicy_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "DataPrincipal"("data_principal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_consent_artifact_id_fkey" FOREIGN KEY ("consent_artifact_id") REFERENCES "ConsentArtifact"("consent_artifact_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProtectionOfficer" ADD CONSTRAINT "DataProtectionOfficer_data_fiduciary_id_fkey" FOREIGN KEY ("data_fiduciary_id") REFERENCES "DataFiduciary"("data_fiduciary_id") ON DELETE RESTRICT ON UPDATE CASCADE;
