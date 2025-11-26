# Changelog

All notable changes to the DPDP Consent Backend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Commits on Nov 26, 2025

#### Refactor
- **7ab1bb8** - Clean up whitespace and improve documentation in consent service methods (SuryaPrakashRJ)
- **b950e5e** - Update consent renewal process and schema to improve clarity and functionality (VenkatMastercoder)
- **6e18ba8** - Streamline GetUserConsentsController for improved readability and maintainability (VenkatMastercoder)

#### Features
- **c8c26bf** - Add consent renewal functionality and related schemas (VenkatMastercoder)
- **62ce864** - Update consent filtering to default to ACTIVE status and enhance validation schema (VenkatMastercoder)
- **b918323** - Enhance consent management to include optional email and phone fields (VenkatMastercoder)

#### Bug Fixes
- **dbcdabb** - Remove uniqueness constraints on email and phone fields in DataPrincipal model (VenkatMastercoder)

### Commits on Nov 25, 2025

#### Features
- **d6489ee** - Add endpoint to retrieve all active purposes for consent flow (VenkatMastercoder)
- **2cc5345** - Add redirect URL support in consent management (VenkatMastercoder)

### Commits on Nov 24, 2025

#### Features
- **9215316** - Implement consent management module with routes, controllers, services, and validation schemas (VenkatMastercoder)

#### Bug Fixes
- **bbfc078** - Update documentation and comment in data principal service (VenkatMastercoder)

### Commits on Nov 7, 2025

#### Features
- **869d704** - Add purpose version history retrieval functionality (VenkatMastercoder)
- **9f90d83** - Add purpose management routes and controllers for category-specific purposes and analytics (VenkatMastercoder)
- **5e5ec62** - Add interfaces, service, and validation schemas for data fiduciary management (VenkatMastercoder)
- **e19d724** - Add PlatformSubmission model and enums for platform types and submission statuses (VenkatMastercoder)
- **5011bc7** - Implement purpose service with CRUD operations and analytics (VenkatMastercoder)

### Commits on Nov 6, 2025

#### Refactor
- **2608e4e** - Update PurposeCategoryController import to use specific controller module (VenkatMastercoder)
- **7492d87** - Streamline purpose category service and controller imports, remove unused mini summary interface and schema (VenkatMastercoder)

#### Features
- **5c70131** - Implement Purpose Category module with controllers, services, interfaces, and validation schemas (VenkatMastercoder)

### Commits on Nov 5, 2025

#### Features
- **63ab9d3** - Implement authentication module with login, OTP verification, and email utilities (VenkatMastercoder)
- **08a7e14** - Implement core middleware and utilities for enhanced API functionality (VenkatMastercoder)

#### Refactor
- **500ac62** - Update role enum values and enhance User model with data fiduciary relation and OTP management (VenkatMastercoder)
- **c4fd68e** - Remove unused files and middleware from DPDP Consent Management System (VenkatMastercoder)
- **9337f7b6** - Improve email transporter setup with enhanced error handling and Gmail compatibility (VenkatMastercoder)
- **e44ea6f** - Enhance email transporter creation with connection verification and error handling (VenkatMastercoder)
- **d529764** - Simplify email transporter creation by removing redundant connection options and using Gmail service directly (VenkatMastercoder)

### Commits on Nov 4, 2025

#### Features
- **e6c9970** - Add initial database migration and schema for DPDP Consent Management System (VenkatMastercoder)

### Commits on Nov 3, 2025

#### Features
- **6da1af0** - Initial commit - DPDP Consent Management System (VenkatMastercoder)

---

## Project Overview

This is a DPDP (Digital Personal Data Protection) Consent Management Backend built with Node.js, Express, TypeScript, and Prisma.

### Key Modules
- **Authentication** - Login, OTP verification, email utilities
- **Consent Management** - Complete consent lifecycle management
- **Purpose Management** - Purpose categories and purpose CRUD operations
- **Data Fiduciary** - Data fiduciary management and operations
- **Data Principal** - User data management

### Tech Stack
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Winston (Logging)
- JWT Authentication
- Zod (Validation)


