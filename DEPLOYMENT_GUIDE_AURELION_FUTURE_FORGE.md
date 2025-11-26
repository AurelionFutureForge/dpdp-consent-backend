# Deployment Guide
## DPDP Consent Management System

**Version:** 1.0
**Last Updated:** November 26, 2025
**Maintained By:** DevOps & Engineering Team

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [Cloud Deployment](#cloud-deployment)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring & Logging](#monitoring--logging)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Load Balancer / CDN                │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼────┐
    │  Node.js │          │ Node.js  │
    │  Server  │          │  Server  │
    │  (8001)  │          │  (8001)  │
    └────┬─────┘          └─────┬────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   PostgreSQL DB     │
         │   (Port 5432)       │
         └─────────────────────┘
```

### Technology Stack
- **Runtime:** Node.js 18.x or higher
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 6.16.2
- **Language:** TypeScript 5.2
- **Process Manager:** PM2 (production)
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes (optional)

---

## Prerequisites

### System Requirements

#### Development
- **CPU:** 2+ cores
- **RAM:** 4GB minimum
- **Storage:** 10GB available space
- **OS:** macOS, Linux, or Windows with WSL2

#### Production
- **CPU:** 4+ cores
- **RAM:** 8GB minimum (16GB recommended)
- **Storage:** 50GB+ SSD
- **OS:** Ubuntu 22.04 LTS or similar

### Required Software

| Software | Minimum Version | Installation |
|----------|----------------|--------------|
| Node.js | 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm | 9.0.0 | Comes with Node.js |
| PostgreSQL | 15.0 | [postgresql.org](https://postgresql.org) |
| Git | 2.30.0 | [git-scm.com](https://git-scm.com) |
| Docker | 24.0.0 | [docker.com](https://docker.com) |
| Docker Compose | 2.20.0 | [docs.docker.com](https://docs.docker.com) |

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/dpdp-consent-backend.git
cd dpdp-consent-backend

# Checkout the appropriate branch
git checkout main
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Or using yarn
# yarn install
```

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Minimum .env configuration:**

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/dpdp_consent_dev
ACCESS_TOKEN_SECRET=your_super_secret_access_token_minimum_32_characters_long
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_minimum_32_characters_long
PORT=8001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
CORS_ORIGIN=*
```

### Step 4: Setup Database

```bash
# Start PostgreSQL (if not running)
# macOS with Homebrew:
brew services start postgresql@15

# Ubuntu/Debian:
sudo systemctl start postgresql

# Create database
createdb dpdp_consent_dev

# Or using psql:
psql -U postgres -c "CREATE DATABASE dpdp_consent_dev;"
```

### Step 5: Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run seed
```

### Step 6: Start Development Server

```bash
# Start with hot reload
npm run dev

# Server will start on http://localhost:8001
```

### Step 7: Verify Installation

```bash
# Test health endpoint
curl http://localhost:8001/health

# Expected response:
# {"message":"DPDP API-V1 Working","status":"healthy","timestamp":"..."}

# Access API documentation
# Open browser: http://localhost:8001/api-docs
```

---

## Environment Configuration

### Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NODE_ENV` | Application environment | Yes | development | production |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - | postgresql://user:pass@host:5432/db |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | Yes | - | random_32_char_string |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | Yes | - | random_32_char_string |
| `PORT` | Application port | No | 8001 | 8001 |
| `HOST` | Application host | No | 0.0.0.0 | 0.0.0.0 |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | Yes | - | https://app.example.com |
| `RESEND_API_KEY` | Resend email API key | Yes | - | re_xxxxx |
| `EMAIL_FROM` | Default sender email | No | - | noreply@example.com |
| `CORS_ORIGIN` | CORS origin pattern | No | * | * |
| `SENTRY_DSN` | Sentry error tracking DSN | No | - | https://xxx@sentry.io/xxx |

### Generating Secrets

```bash
# Generate random secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### Environment-Specific Configurations

#### Development (.env.development)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/dpdp_dev
ACCESS_TOKEN_SECRET=dev_access_secret_32_chars_minimum
REFRESH_TOKEN_SECRET=dev_refresh_secret_32_chars_minimum
PORT=8001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
RESEND_API_KEY=re_dev_test_key
CORS_ORIGIN=*
```

#### Production (.env.production)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/dpdp_prod
ACCESS_TOKEN_SECRET=<SECURE_RANDOM_STRING_32_CHARS_MIN>
REFRESH_TOKEN_SECRET=<SECURE_RANDOM_STRING_32_CHARS_MIN>
PORT=8001
HOST=0.0.0.0
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
RESEND_API_KEY=re_prod_live_key_xxxxx
EMAIL_FROM=noreply@example.com
CORS_ORIGIN=https://example.com
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Database Setup

### Local PostgreSQL Setup

#### macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb dpdp_consent_dev

# Verify connection
psql -d dpdp_consent_dev -c "SELECT version();"
```

#### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres psql
CREATE USER dpdp_user WITH PASSWORD 'secure_password';
CREATE DATABASE dpdp_consent_dev OWNER dpdp_user;
GRANT ALL PRIVILEGES ON DATABASE dpdp_consent_dev TO dpdp_user;
\q
```

#### Windows

```bash
# Download and install from postgresql.org
# Or use Docker (see Docker section)
```

### Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate -- --name migration_name

# Apply migrations
npm run prisma:migrate

# Reset database (WARNING: Deletes all data)
npm run prisma:reset

# View database in Prisma Studio
npm run prisma:studio
```

### Database Backup & Restore

```bash
# Backup
pg_dump -U postgres -d dpdp_consent_prod > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d dpdp_consent_prod < backup_20251126.sql

# Backup with compression
pg_dump -U postgres -d dpdp_consent_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore from compressed backup
gunzip -c backup_20251126.sql.gz | psql -U postgres -d dpdp_consent_prod
```

---

## Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files and Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/src/server.js"]
```

#### Build and Run

```bash
# Build Docker image
docker build -t dpdp-consent-backend:latest .

# Run container
docker run -d \
  --name dpdp-backend \
  -p 8001:8001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e ACCESS_TOKEN_SECRET="your_secret" \
  -e REFRESH_TOKEN_SECRET="your_secret" \
  -e RESEND_API_KEY="your_key" \
  dpdp-consent-backend:latest

# View logs
docker logs -f dpdp-backend

# Stop container
docker stop dpdp-backend

# Remove container
docker rm dpdp-backend
```

### Docker Compose Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: dpdp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: dpdp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secure_password}
      POSTGRES_DB: dpdp_consent_db
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - dpdp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dpdp_user -d dpdp_consent_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Application Server
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dpdp-backend
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://dpdp_user:${DB_PASSWORD:-secure_password}@postgres:5432/dpdp_consent_db
      ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      PORT: 8001
      HOST: 0.0.0.0
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - dpdp-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # (Optional) Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: dpdp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - dpdp-network

volumes:
  postgres_data:
    driver: local

networks:
  dpdp-network:
    driver: bridge
```

#### .env for Docker Compose

```bash
# .env
DB_PASSWORD=super_secure_database_password
ACCESS_TOKEN_SECRET=your_super_secret_access_token_32_chars_min
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_32_chars_min
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
ALLOWED_ORIGINS=https://yourdomain.com
```

#### Running Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npm run prisma:migrate

# Seed database
docker-compose exec app npm run seed

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or local with minikube)
- kubectl configured
- Docker registry access

### Kubernetes Manifests

#### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dpdp-consent
```

#### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dpdp-config
  namespace: dpdp-consent
data:
  NODE_ENV: "production"
  PORT: "8001"
  HOST: "0.0.0.0"
  ALLOWED_ORIGINS: "https://yourdomain.com"
  CORS_ORIGIN: "https://yourdomain.com"
```

#### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: dpdp-secrets
  namespace: dpdp-consent
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres-service:5432/dpdp_db"
  ACCESS_TOKEN_SECRET: "your_access_token_secret"
  REFRESH_TOKEN_SECRET: "your_refresh_token_secret"
  RESEND_API_KEY: "re_xxxxxxxxxxxxxxxx"
```

**Create secrets from file:**

```bash
kubectl create secret generic dpdp-secrets \
  --from-env-file=.env.production \
  --namespace=dpdp-consent
```

#### PostgreSQL Deployment

```yaml
# k8s/postgres-deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: dpdp-consent
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: dpdp-consent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: dpdp_consent_db
        - name: POSTGRES_USER
          value: dpdp_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: dpdp-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: dpdp-consent
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

#### Application Deployment

```yaml
# k8s/app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dpdp-backend
  namespace: dpdp-consent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dpdp-backend
  template:
    metadata:
      labels:
        app: dpdp-backend
    spec:
      containers:
      - name: dpdp-backend
        image: your-registry/dpdp-consent-backend:latest
        ports:
        - containerPort: 8001
        envFrom:
        - configMapRef:
            name: dpdp-config
        - secretRef:
            name: dpdp-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 20
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: dpdp-backend-service
  namespace: dpdp-consent
spec:
  selector:
    app: dpdp-backend
  ports:
  - port: 80
    targetPort: 8001
  type: LoadBalancer
```

#### Ingress (Optional)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dpdp-ingress
  namespace: dpdp-consent
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: dpdp-tls-secret
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dpdp-backend-service
            port:
              number: 80
```

### Deploying to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n dpdp-consent
kubectl get services -n dpdp-consent

# View logs
kubectl logs -f deployment/dpdp-backend -n dpdp-consent

# Run migrations
kubectl exec -it deployment/dpdp-backend -n dpdp-consent -- npm run prisma:migrate

# Scale deployment
kubectl scale deployment/dpdp-backend --replicas=5 -n dpdp-consent
```

---

## Cloud Deployment

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-18 dpdp-consent-backend

# Create environment
eb create dpdp-prod-env

# Deploy
eb deploy

# View logs
eb logs

# Set environment variables
eb setenv DATABASE_URL="postgresql://..." ACCESS_TOKEN_SECRET="..."
```

### Google Cloud Platform (Cloud Run)

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/dpdp-backend

# Deploy to Cloud Run
gcloud run deploy dpdp-backend \
  --image gcr.io/PROJECT_ID/dpdp-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://...",ACCESS_TOKEN_SECRET="..."
```

### Azure (App Service)

```bash
# Create resource group
az group create --name dpdp-rg --location eastus

# Create App Service plan
az appservice plan create --name dpdp-plan --resource-group dpdp-rg --is-linux --sku B1

# Create web app
az webapp create --resource-group dpdp-rg --plan dpdp-plan --name dpdp-backend --runtime "NODE:18-lts"

# Deploy
az webapp deployment source config-zip --resource-group dpdp-rg --name dpdp-backend --src deploy.zip
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npm run prisma:generate

      - name: Run migrations
        run: npm run prisma:migrate
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          ACCESS_TOKEN_SECRET: test_secret_32_chars_minimum
          REFRESH_TOKEN_SECRET: test_secret_32_chars_minimum

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: your-registry/dpdp-backend:latest,${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          # Add your deployment commands here
          echo "Deploying to production..."
```

---

## Monitoring & Logging

### Application Logging (Winston)

Logs are configured in `src/modules/common/utils/logger.ts`

```bash
# View logs
tail -f combined.log
tail -f error.log

# Search logs
grep "ERROR" error.log
grep "Consent" combined.log
```

### Sentry Integration

Already configured in `src/app.ts`. Set `SENTRY_DSN` in environment variables.

### Health Checks

```bash
# Basic health check
curl http://localhost:8001/health

# Database health check
curl http://localhost:8001/health/db
```

---

## Security Considerations

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up Sentry for error tracking
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Use environment-specific configs
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerts

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 8001
lsof -i :8001
# Or
netstat -ano | grep 8001

# Kill process
kill -9 <PID>
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d dpdp_consent_dev -c "SELECT 1;"
```

**Prisma Client not generated:**
```bash
npm run prisma:generate
```

---

**End of Deployment Guide**

