# DPDP Consent Management System (CMS)

A comprehensive, privacy-first consent management system built in compliance with the **Digital Personal Data Protection (DPDP) Act, 2023**.

## Overview

The DPDP Consent Management System (CMS) is a robust backend solution designed to help organizations comply with India's Digital Personal Data Protection Act, 2023. This system provides a complete framework for managing user consent, tracking data processing activities, ensuring data subject rights, and maintaining comprehensive audit logs.

### Key Benefits

- **Regulatory Compliance**: Built specifically for DPDP Act 2023 compliance
- **Privacy by Design**: Privacy controls integrated from the ground up
- **Scalable Architecture**: Designed to handle high-volume consent management
- **API-First**: RESTful APIs for easy integration with existing systems
- **Comprehensive Auditing**: Complete audit trail of all data processing activities

## Features

- **Consent Management**: Capture, store, and manage user consent records
- **Data Subject Rights**: Support for data access, rectification, erasure requests
- **Audit Logging**: Comprehensive logging of all data processing activities
- **Privacy by Design**: Built-in privacy controls and data minimization
- **Compliance Tracking**: Monitor and ensure DPDP Act compliance
- **API-First Architecture**: RESTful APIs for seamless integration
- **Scalable Design**: Horizontal scaling support for high-traffic scenarios
- **JWT Authentication**: Secure token-based authentication
- **Type Safety**: Full TypeScript implementation with runtime validation

## Tech Stack

### Core Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI

### Additional Tools

- **Code Quality**: ESLint
- **Process Manager**: Nodemon (development)
- **Build Tool**: TypeScript Compiler
- **Error Tracking**: Sentry (optional)

## Project Structure

```
src/
├── api/
│   └── v1/
│       ├── controllers/        # Request handlers
│       ├── interfaces/         # TypeScript interfaces
│       ├── middlewares/        # Auth and validation middleware
│       ├── routers/            # API routes
│       ├── services/           # Business logic
│       │   ├── consentService/     # Consent management
│       │   ├── dataSubjectService/ # Data subject rights handling
│       │   └── auditService/       # Audit logging
│       ├── utils/              # Utility functions
│       └── validations/        # Request validation schemas
├── config/                     # Global config
│   ├── env/                    # Environment variables
│   └── swagger/                # API documentation
├── prisma/                     # Database schema and migrations
└── server.ts                   # Entry point
```

## Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm**: v9 or higher (or yarn)
- **PostgreSQL**: v14 or higher
- **Git**: For version control

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd DPDP
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=8001
   HOST=0.0.0.0
   
   # PostgreSQL Database
   DATABASE_URL=postgresql://username:password@localhost:5432/dpdp_cms
   
   # JWT Authentication
   ACCESS_TOKEN_SECRET=your-secret-key-here
   ACCESS_TOKEN_EXPIRES_IN=1d
   
   # CORS Configuration
   CORS_ORIGIN=*
   ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-url.com
   ```

4. **Database Setup**:

   Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

   Push database schema:
   ```bash
   npm run prisma:push
   ```

   Or run migrations:
   ```bash
   npm run prisma:migrate
   ```

   (Optional) Open Prisma Studio to view database:
   ```bash
   npm run prisma:studio
   ```

5. **Verify Installation**:
   
   Run type checking:
   ```bash
   npm run typecheck
   ```
   
   Run linting:
   ```bash
   npm run lint
   ```

## Usage

### Development

Start the development server with hot-reload:
```bash
npm run dev
```

The server will start on `http://localhost:8001` (or the port specified in `.env`).

### Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### API Documentation

Once the server is running, access the interactive API documentation at:
```
http://localhost:8001/api-docs
```

### Example API Usage

#### Health Check
```bash
curl http://localhost:8001/health
```

#### Authentication Example
```bash
# Login (example endpoint)
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Create Consent Record (example endpoint)
```bash
curl -X POST http://localhost:8001/api/v1/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user-id",
    "purpose": "marketing",
    "consentGiven": true
  }'
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot-reload

# Testing
npm run test             # Run tests
npm run test:verbose     # Run tests with verbose output
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # Check code for linting errors
npm run lint:fix         # Fix linting errors automatically
npm run typecheck        # Type check without compiling

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:reset     # Reset database (development only)

# Build & Production
npm run build            # Build for production
npm run start            # Start production server
npm run clean            # Clean build directory
```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure they pass:
   - Type checking: `npm run typecheck`
   - Linting: `npm run lint`
   - Tests: `npm run test`

3. **Commit your changes** (follow conventional commits):
   ```bash
   git commit -m "feat(scope): your commit message"
   ```

4. **Push and create a Pull Request**

For more details, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Architecture Details

This project uses a modern, privacy-first architecture with the following principles:

- **Type Safety**: Full TypeScript implementation with Prisma for database types
- **Runtime Validation**: Zod schemas for request/response validation
- **Functional Programming**: Clean, testable code organization
- **Separation of Concerns**: Controllers, services, and data access layers
- **Error Handling**: Centralized error handling middleware
- **Security First**: Helmet, CORS, and rate limiting built-in

## Key Services

- **Consent Service**: Manages user consent capture, storage, and retrieval
- **Data Subject Service**: Handles data subject rights requests (access, rectification, erasure)
- **Audit Service**: Comprehensive logging and tracking of all data processing activities
- **Authentication Service**: Secure JWT-based authentication and authorization

## Compliance & Privacy

The application is designed to comply with the **Digital Personal Data Protection (DPDP) Act, 2023**:

- **Consent Management**: Explicit consent capture and tracking
- **Data Minimization**: Only collect and process necessary data
- **Purpose Limitation**: Process data only for specified purposes
- **Storage Limitation**: Retain data only as long as necessary
- **Transparency**: Clear documentation of data processing activities
- **Security**: Robust security measures to protect personal data
- **Data Subject Rights**: Support for all rights under DPDP Act

## Scaling

The application supports horizontal scaling through:
- Stateless API design with PostgreSQL
- Connection pooling for database efficiency
- Modular service architecture
- RESTful API design for easy integration

## Contributing

Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Code of Conduct

This project adheres to a Code of Conduct. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for more details.

## License

ISC

---

**Developed by**: Aurelion Future Forge Private Limited  
**Project**: DPDP Consent Management System (CMS)  
**Compliance**: Digital Personal Data Protection (DPDP) Act, 2023