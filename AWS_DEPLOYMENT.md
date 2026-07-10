# AWS Deployment Guide for ECG AI Platform

## Table of Contents
1. [Why New Accounts Disappearing on AWS](#why-new-accounts-disappearing-on-aws)
2. [Option 1: Quick Deployment with EFS (JSON DB Persistence)](#option-1-quick-deployment-with-efs-json-db-persistence)
3. [Option 2: Production Deployment with PostgreSQL (Recommended)](#option-2-production-deployment-with-postgresql-recommended)
4. [Email Setup for Password Reset](#email-setup-for-password-reset)
5. [Architecture Overview](#architecture-overview)

---

## Why New Accounts Disappearing on AWS

### Problem
The default database uses JSON file stored in the container's local storage. When containers restart or scale, the JSON file is lost.

### Solution
Use one of the following options to persist data:

---

## Option 1: Quick Deployment with EFS (JSON DB Persistence)

This is the simplest way to deploy with the existing JSON database.

### Steps

#### Step 1: Create an EFS File System
1. Go to AWS Console → EFS
2. Create a new file system in your VPC
3. Note the File System ID and DNS name

#### Step 2: Create an ECS Task Definition
1. Go to Amazon ECS → Task Definitions
2. Create new task definition
3. Add volumes:
   - Name: `ecg-data
   - Volume type: `EFS
   - File system ID: [your EFS ID]
   - Root directory: `/`
4. In your backend container mount points:
   - Source volume: `ecg-data`
   - Container path: `/app/data`

#### Step 3: Update docker-compose.yml for EFS (Local Test
```yaml
version: '3.8'
services:
  backend:
    image: [your-ecr-repo]/ecg-backend:latest
    volumes:
      - ecg-data:/app/data
      - ecg-uploads:/app/uploads
    # ... rest of config
volumes:
  ecg-data:
    driver: local
  ecg-uploads:
    driver: local
```

#### Step 4: Set Up Other AWS Services
- **ECR**: Store your Docker images
- **ECS Fargate**: Run containers
- **ALB**: Application Load Balancer
- **CloudWatch**: Logs and monitoring
- **Secrets Manager**: Store JWT_SECRET and other secrets

---

## Option 2: Production Deployment with PostgreSQL (Recommended)

Replace JSON database with Amazon RDS PostgreSQL for better performance, scalability, and reliability.

### Steps:

#### Step 1: Set Up Amazon RDS PostgreSQL
1. Go to AWS Console → RDS
2. Create database:
   - Engine: PostgreSQL
   - Template: Production or Free Tier
   - DB instance identifier: ecg-platform-db
   - Master username: postgres
   - Master password: [secure password]
3. Note:
   - Endpoint
   - Port
   - DB name

#### Step 2: Update Backend Database Config
Update `backend/src/config/database.js` to use PostgreSQL.
First, install pg client:
```bash
cd backend
npm install pg pg-hstore
```

#### Step 3: Deploy and Test

---

## Architecture Overview

### Quick Deployment (EFS)
```
User → ALB → ECS Fargate (Backend + Frontend + ML) → EFS (JSON DB)
```

### Production Deployment (PostgreSQL)
```
User → ALB → ECS Fargate (Backend + Frontend + ML) → RDS PostgreSQL
```

---

## Important Notes
1. **HTTPS**: Always use HTTPS in production
2. **Security Groups**: Restrict access to RDS and ECS
3. **Backups**: Enable automated backups for RDS
4. **Scaling**: For scaling, use RDS read replicas
5. **Cost**: Monitor costs with AWS Cost Explorer

---

## Email Setup for Password Reset

To enable password reset emails in production, you need to configure an email service. Here are two options:

### Option A: Use AWS SES (Recommended for AWS)
1. Go to AWS Console → SES
2. Verify your sender email address or domain
3. Request production access if needed (to send to non-verified emails)
4. Create SMTP credentials in SES (under "SMTP Settings")
5. Set these environment variables in your ECS task definition:
   ```
   EMAIL_HOST=email-smtp.[region].amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=[your SES SMTP username]
   EMAIL_PASS=[your SES SMTP password]
   EMAIL_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

### Option B: Use Gmail (For Testing Only)
⚠️ Note: Gmail requires an App Password for this to work
1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password (select "Mail" and "Other (Custom Name)")
4. Set these environment variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   FRONTEND_URL=https://yourdomain.com
   ```

### Environment Variables
Make sure to set these in your deployment environment (Secrets Manager, ECS task definition, etc.):
- `FRONTEND_URL`: Your app's public URL (e.g., `https://yourdomain.com`)
- All the email variables above

### Troubleshooting Email Issues
1. **Check CloudWatch Logs**: Look for `📧` and `[SIMULATED]` messages in the backend logs!
   - If you see `[SIMULATED]`, email is not configured properly!
   - Look for error messages from nodemailer!
2. **Verify Environment Variables**: Make sure all `EMAIL_*` variables are set correctly!
3. **Check Sender Email Verification**: In SES, make sure your sender email is verified!
4. **Check for Sandbox Mode**: SES is in sandbox mode by default - you can only send to verified emails!
5. **Check Security Groups**: Ensure your ECS tasks can reach the SMTP server (outbound traffic on port 587 or 465)

---

## Useful Links
- [Amazon ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Amazon RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Amazon EFS Documentation](https://docs.aws.amazon.com/efs/)
- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/)
