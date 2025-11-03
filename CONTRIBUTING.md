# Contributing to DPDP

Thank you for your interest in contributing to DPDP! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/kitty-magic.git
   cd kitty-magic/DPDP
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/original-owner/kitty-magic.git
   ```

## Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- PostgreSQL database
- RabbitMQ (optional, for message queuing features)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3003
   HOST=0.0.0.0
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   
   # RabbitMQ (optional)
   RABBITMQ_URL=amqp://username:password@localhost:5672
   
   # JWT
   ACCESS_TOKEN_SECRET=your-secret-key
   ACCESS_TOKEN_EXPIRES_IN=1d
   
   # CORS
   CORS_ORIGIN=*
   ALLOWED_ORIGINS=http://localhost:3000
   ```

3. **Set up the database**:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

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
│       ├── utils/              # Utility functions
│       ├── validations/        # Request validation schemas
│       └── __tests__/          # Test files
├── config/                     # Global configuration
│   ├── env/                    # Environment variables
│   └── swagger/                # API documentation
└── server.ts                   # Application entry point
```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Avoid using `any` type - prefer specific types or `unknown`
- Use interfaces for object shapes and types for unions/primitives
- Export types and interfaces from `interfaces/index.ts`
- Use async/await instead of Promise chains
- Handle errors appropriately - don't swallow exceptions silently

### Code Style

- Follow the existing code style and formatting
- Use meaningful variable and function names
- Write self-documenting code with clear logic
- Keep functions small and focused (single responsibility)
- Use ESLint to check your code:
  ```bash
  npm run lint
  ```
- Fix linting issues:
  ```bash
  npm run lint:fix
  ```

### File Naming

- Use kebab-case for file names: `user-service.ts`, `auth-middleware.ts`
- Use PascalCase for classes: `class UserService`
- Use camelCase for functions and variables: `getUserById`, `userId`

### Import Organization

- Group imports: external packages, then internal modules
- Use absolute imports with path aliases when available
- Sort imports alphabetically within groups

Example:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '@config/env/env';
import { UserService } from '@api/v1/services/userService';
```

## Commit Guidelines

We follow conventional commit format for clear commit history:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(api): add user authentication endpoint

- Add POST /api/v1/auth/login endpoint
- Implement JWT token generation
- Add authentication middleware

Closes #123
```

```
fix(services): resolve message delivery issue

Fix race condition in message delivery service that caused
messages to be delivered out of order.

Fixes #456
```

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**:
   - Write clean, tested code
   - Follow coding standards
   - Update documentation if needed
   - Add tests for new features

3. **Test your changes**:
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Include a clear description of changes
   - Link any related issues

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the project's coding standards
- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow the conventional format
- [ ] Branch is up to date with `main`

### PR Review Process

- PRs will be reviewed by maintainers
- Address any review feedback promptly
- Be open to suggestions and improvements
- Keep PRs focused and reasonably sized

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with verbose output
npm run test:verbose

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

- Write tests for all new features and bug fixes
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies
- Keep tests isolated and independent
- Follow the existing test structure

Example test structure:
```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      // Test implementation
    });

    it('should throw error when user not found', async () => {
      // Test implementation
    });
  });
});
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or error messages
- Minimal code example (if applicable)

### Feature Requests

For feature requests, please include:

- Clear description of the proposed feature
- Use case and motivation
- Possible implementation approach (if you have ideas)
- Any alternatives considered

## Getting Help

- Check existing [Issues](https://github.com/your-org/kitty-magic/issues)
- Review the [README.md](./README.md)
- Open a new issue for questions or problems
- Reach out to maintainers if needed

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

Thank you for contributing to DPDP! 🚀

