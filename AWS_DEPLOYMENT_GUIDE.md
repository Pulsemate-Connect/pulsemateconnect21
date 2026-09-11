# PulseMate Connect - AWS Deployment Guide

**Complete Production Deployment on AWS**  
**Date:** September 11, 2026  
**Application:** PulseMate Connect (Healthcare Appointment & Queue Management)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Services Required](#aws-services-required)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Database Setup (RDS)](#database-setup-rds)
5. [Backend Deployment (Elastic Beanstalk)](#backend-deployment-elastic-beanstalk)
6. [Frontend Deployment (S3 + CloudFront)](#frontend-deployment-s3--cloudfront)
7. [File Storage (S3)](#file-storage-s3)
8. [Environment Variables](#environment-variables)
9. [Domain & SSL Setup](#domain--ssl-setup)
10. [Monitoring & Logging](#monitoring--logging)
11. [Cost Estimation](#cost-estimation)
12. [Deployment Commands](#deployment-commands)
13. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                     │
│          (Patients, Doctors, Clinic Owners, Admins)             │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                                 │
│               pulsemateconnect.in                                 │
│               api.pulsemateconnect.in                            │
└───────────────────┬──────────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
┌───────────────┐      ┌──────────────────┐
│  CloudFront   │      │  CloudFront      │
│  (Frontend)   │      │  (Backend API)   │
│  CDN Cache    │      │  CDN + SSL       │
└───────┬───────┘      └─────────┬────────┘
        │                        │
        ▼                        ▼
┌───────────────┐      ┌──────────────────┐
│   S3 Bucket   │      │ Elastic Beanstalk │
│   (React      │      │  (Node.js API)    │
│    Build)     │      │  Auto-scaling     │
└───────────────┘      └─────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │   RDS    │  │    S3    │  │ ElastiCache│
            │PostgreSQL│  │  Media   │  │   Redis   │
            │ Database │  │ Storage  │  │   Cache   │
            └──────────┘  └──────────┘  └──────────┘
```

---

## AWS Services Required

### Core Services:

| Service | Purpose | Estimated Cost/Month |
|---------|---------|---------------------|
| **EC2 (Elastic Beanstalk)** | Backend API hosting | $30-80 |
| **RDS (PostgreSQL)** | Database | $25-100 |
| **S3** | Frontend + Media storage | $5-20 |
| **CloudFront** | CDN for frontend & API | $10-30 |
| **Route 53** | DNS management | $0.50-2 |
| **Certificate Manager** | Free SSL certificates | FREE |
| **CloudWatch** | Monitoring & Logs | $5-15 |
| **ElastiCache (Redis)** | Session & caching (optional) | $15-50 |
| **VPC** | Network isolation | FREE |

**Total Estimated:** **$90-300/month** (varies by traffic)

---

## Pre-Deployment Checklist

### 1. AWS Account Setup

- [ ] Create AWS account
- [ ] Set up billing alerts
- [ ] Enable MFA on root account
- [ ] Create IAM user with admin access
- [ ] Install AWS CLI: `aws configure`

### 2. Domain & SSL

- [ ] Purchase domain (pulsemateconnect.in)
- [ ] Point nameservers to Route 53
- [ ] Request SSL certificate in AWS Certificate Manager

### 3. Code Preparation

- [ ] Test locally: `npm run dev` (backend), `npm run dev` (frontend)
- [ ] Run all tests: `npm run test`
- [ ] Update environment variables
- [ ] Build frontend: `npm run build`
- [ ] Generate Prisma client: `npx prisma generate`

### 4. Security

- [ ] Rotate all secrets (JWT, cookies, API keys)
- [ ] Update CORS allowed origins
- [ ] Review .gitignore (no secrets committed)
- [ ] Enable rate limiting
- [ ] Configure CSP headers

---

## Database Setup (RDS)

### Step 1: Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier pulsemate-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password 'GENERATE_STRONG_PASSWORD' \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name pulsemate-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window '03:00-04:00' \
  --preferred-maintenance-window 'mon:04:00-mon:05:00' \
  --storage-encrypted \
  --publicly-accessible true \
  --tags Key=Environment,Value=Production Key=Application,Value=PulseMate
```

### Step 2: Configure Security Group

**Inbound Rules:**
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: Elastic Beanstalk security group ID

### Step 3: Database Connection String

```
# Format:
postgresql://USERNAME:PASSWORD@ENDPOINT:5432/DATABASE_NAME?schema=public

# Example:
DATABASE_URL=postgresql://postgres:SecurePass123@pulsemate-db-prod.abc123.ap-south-1.rds.amazonaws.com:5432/pulsemate?schema=public

DIRECT_URL=postgresql://postgres:SecurePass123@pulsemate-db-prod.abc123.ap-south-1.rds.amazonaws.com:5432/pulsemate?schema=public
```

### Step 4: Run Migrations

```bash
# Connect to RDS
export DATABASE_URL="postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/pulsemate"

# Run Prisma migrations
npx prisma migrate deploy

# Or push schema
npx prisma db push

# Verify
npx prisma studio
```

### Step 5: Backup Strategy

```bash
# Enable automated backups (already set in create command)
# Retention: 7 days minimum

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier pulsemate-db-prod \
  --db-snapshot-identifier pulsemate-manual-snapshot-$(date +%Y%m%d)
```

---

## Backend Deployment (Elastic Beanstalk)

### Option A: Using Elastic Beanstalk Console (Recommended for first-time)

#### Step 1: Prepare Application

```bash
cd backend

# Create .ebignore file
cat > .ebignore << 'EOF'
node_modules/
tests/
*.test.js
.env.local
.env.development
coverage/
*.log
prisma/migrations/
.git/
EOF

# Create Procfile
cat > Procfile << 'EOF'
web: npm run start
EOF

# Create .ebextensions/01_nodecommands.config
mkdir -p .ebextensions
cat > .ebextensions/01_nodecommands.config << 'EOF'
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    NPM_CONFIG_PRODUCTION: false
EOF

# Create package command hook
cat > .ebextensions/02_prisma.config << 'EOF'
container_commands:
  01_prisma_generate:
    command: "npx prisma generate"
    leader_only: true
EOF
```

#### Step 2: Initialize EB Application

```bash
# Install EB CLI
pip install awsebcli --upgrade

# Initialize
eb init -p node.js-18 pulsemate-backend --region ap-south-1

# Create environment
eb create pulsemate-backend-prod \
  --instance-type t3.small \
  --envvars \
    NODE_ENV=production,\
    DATABASE_URL='postgresql://USER:PASS@RDS_ENDPOINT/pulsemate',\
    JWT_SECRET='your-jwt-secret',\
    PORT=8080

# Deploy
eb deploy

# Check status
eb status
eb health

# View logs
eb logs
```

#### Step 3: Configure Load Balancer

```bash
# Enable HTTPS
eb elb enable-healthcheck \
  --application-name pulsemate-backend \
  --environment-name pulsemate-backend-prod

# Add SSL certificate to load balancer (in console)
# Go to: EC2 > Load Balancers > Add HTTPS listener
# Port: 443
# Certificate: Select from ACM
```

### Option B: Using AWS Console

1. **Create Application:**
   - Go to Elastic Beanstalk console
   - Click "Create Application"
   - Name: `pulsemate-backend`
   - Platform: Node.js 18
   - Upload code: ZIP your backend folder

2. **Configure Environment:**
   - Environment name: `pulsemate-backend-prod`
   - Instance type: `t3.small` (or t3.micro for testing)
   - Enable auto-scaling: Min 1, Max 3
   - Load balancer: Application Load Balancer
   - Enable HTTPS (port 443)

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   JWT_SECRET=...
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   FIREBASE_SERVICE_ACCOUNT_JSON=...
   MESSAGE_CENTRAL_CUSTOMER_ID=...
   RESEND_API_KEY=...
   COOKIE_SECRET=...
   FRONTEND_URL=https://pulsemateconnect.in
   BACKEND_URL=https://api.pulsemateconnect.in
   ```

4. **Deploy:**
   - Upload ZIP or connect to GitHub
   - Click "Deploy"
   - Wait for deployment (5-10 minutes)

---

## Frontend Deployment (S3 + CloudFront)

### Step 1: Build React App

```bash
cd frontend

# Update .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://api.pulsemateconnect.in/api
VITE_SOCKET_URL=https://api.pulsemateconnect.in
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_RAZORPAY_KEY_ID=rzp_live_Sz5uowTvIY9Mwv
EOF

# Build for production
npm run build

# Output will be in dist/ folder
ls -la dist/
```

### Step 2: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://pulsemate-frontend-prod --region ap-south-1

# Enable static website hosting
aws s3 website s3://pulsemate-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::pulsemate-frontend-prod/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket pulsemate-frontend-prod \
  --policy file://bucket-policy.json

# Upload build files
aws s3 sync dist/ s3://pulsemate-frontend-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "service-worker.js"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://pulsemate-frontend-prod/ \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Step 3: Create CloudFront Distribution

```bash
# Create CloudFront distribution
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "pulsemate-frontend-$(date +%s)",
  "Aliases": {
    "Quantity": 1,
    "Items": ["pulsemateconnect.in", "www.pulsemateconnect.in"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-pulsemate-frontend",
      "DomainName": "pulsemate-frontend-prod.s3.ap-south-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-pulsemate-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["HEAD", "GET"]
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }]
  },
  "Enabled": true,
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**Or use Console:**
1. Go to CloudFront console
2. Create Distribution
3. Origin: `pulsemate-frontend-prod.s3.ap-south-1.amazonaws.com`
4. Viewer Protocol: Redirect HTTP to HTTPS
5. Alternate Domain Names: `pulsemateconnect.in`, `www.pulsemateconnect.in`
6. SSL Certificate: Select from ACM
7. Default Root Object: `index.html`
8. Custom Error Pages: 404 → /index.html (200)

### Step 4: Deployment Script

```bash
# Create deploy.sh
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Building frontend..."
npm run build

echo "📦 Uploading to S3..."
aws s3 sync dist/ s3://pulsemate-frontend-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://pulsemate-frontend-prod/ \
  --cache-control "no-cache"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
EOF

chmod +x deploy.sh

# Run deployment
./deploy.sh
```

---

## File Storage (S3)

### Media Uploads Bucket

```bash
# Create uploads bucket
aws s3 mb s3://pulsemate-uploads-prod --region ap-south-1

# Enable CORS
cat > cors.json << 'EOF'
{
  "CORSRules": [{
    "AllowedOrigins": ["https://pulsemateconnect.in", "https://www.pulsemateconnect.in"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}
EOF

aws s3api put-bucket-cors \
  --bucket pulsemate-uploads-prod \
  --cors-configuration file://cors.json

# Set lifecycle policy (delete temp files after 7 days)
cat > lifecycle.json << 'EOF'
{
  "Rules": [{
    "Id": "DeleteTempFiles",
    "Status": "Enabled",
    "Prefix": "temp/",
    "Expiration": {
      "Days": 7
    }
  }]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket pulsemate-uploads-prod \
  --lifecycle-configuration file://lifecycle.json
```

### Update Backend to Use S3

**Option 1:** Continue using Cloudinary (current setup) ✅  
**Option 2:** Switch to S3 (requires code changes)

---

## Environment Variables

### Backend (.env)

```bash
# Production Environment Variables for Elastic Beanstalk

# Database
DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/pulsemate?schema=public
DIRECT_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/pulsemate?schema=public

# Server
NODE_ENV=production
PORT=8080
BACKEND_URL=https://api.pulsemateconnect.in
FRONTEND_URL=https://pulsemateconnect.in

# JWT (Generate new secrets!)
JWT_SECRET=<GENERATE_64_CHAR_HEX>
JWT_ACCESS_SECRET=<GENERATE_64_CHAR_HEX>
JWT_REFRESH_SECRET=<GENERATE_64_CHAR_HEX>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Session
SESSION_MAX_AGE_DAYS=30
SESSION_IDLE_TIMEOUT_DAYS=7
COOKIE_SECRET=<GENERATE_64_CHAR_HEX>

# Payment
RAZORPAY_KEY_ID=rzp_live_Sz5uowTvIY9Mwv
RAZORPAY_KEY_SECRET=wVhmp2dFNEQGFfytMiT5NYk1

# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON=<YOUR_JSON>

# Cloudinary
CLOUDINARY_CLOUD_NAME=pulsemateconnect
CLOUDINARY_API_KEY=517831889895763
CLOUDINARY_API_SECRET=kF5FqIFsR2NSQ5IIy17NAKeScXs

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
RESEND_FROM_EMAIL=PulseMate <noreply@pulsemateconnect.in>

# SMS
SMS_PROVIDER=messagecentral
MESSAGE_CENTRAL_BASE_URL=https://cpaas.messagecentral.com
MESSAGE_CENTRAL_CUSTOMER_ID=YOUR_MC_CUSTOMER_ID
MESSAGE_CENTRAL_EMAIL=pulsemateconnect@gmail.com
MESSAGE_CENTRAL_PASSWORD=YOUR_MC_PASSWORD

# OTP
OTP_PROVIDER=messagecentral
ENABLE_TEST_OTP=false
```

### Generate New Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate cookie secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Domain & SSL Setup

### Step 1: Request SSL Certificate

```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name pulsemateconnect.in \
  --subject-alternative-names www.pulsemateconnect.in api.pulsemateconnect.in \
  --validation-method DNS \
  --region us-east-1

# Get validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID \
  --region us-east-1
```

### Step 2: Route 53 DNS Configuration

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name pulsemateconnect.in \
  --caller-reference $(date +%s)

# Add records
# Frontend (CloudFront)
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "pulsemateconnect.in",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d123456.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}

# Backend API (Elastic Beanstalk)
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.pulsemateconnect.in",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "pulsemate-backend-prod.ap-south-1.elasticbeanstalk.com"
      }]
    }
  }]
}
```

---

## Monitoring & Logging

### CloudWatch Setup

```bash
# Enable detailed monitoring
aws cloudwatch put-metric-alarm \
  --alarm-name pulsemate-backend-cpu-high \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ElasticBeanstalk \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create log group
aws logs create-log-group --log-group-name /aws/elasticbeanstalk/pulsemate-backend

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/elasticbeanstalk/pulsemate-backend \
  --retention-in-days 30
```

### Application Monitoring

```javascript
// backend/src/middleware/monitoring.js
const { CloudWatch } = require('@aws-sdk/client-cloudwatch');

const cloudwatch = new CloudWatch({ region: 'ap-south-1' });

const trackMetric = async (metricName, value) => {
  await cloudwatch.putMetricData({
    Namespace: 'PulseMate',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  });
};

module.exports = { trackMetric };
```

---

## Cost Estimation

### Monthly AWS Costs (Estimated)

**Scenario A: Small Clinic (< 1000 appointments/month)**
- EC2 (t3.micro): $8
- RDS (db.t3.micro): $15
- S3 + CloudFront: $5
- **Total: ~$30/month**

**Scenario B: Medium (5000 appointments/month)**
- EC2 (t3.small): $15
- RDS (db.t3.small): $35
- S3 + CloudFront: $15
- ElastiCache (cache.t3.micro): $12
- **Total: ~$80/month**

**Scenario C: Large (20,000+ appointments/month)**
- EC2 (t3.medium x 2): $60
- RDS (db.t3.medium): $70
- S3 + CloudFront: $30
- ElastiCache (cache.t3.small): $25
- **Total: ~$200/month**

---

## Deployment Commands

### Quick Reference

```bash
# Backend deployment
cd backend
eb deploy

# Frontend deployment
cd frontend
npm run build
aws s3 sync dist/ s3://pulsemate-frontend-prod/ --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"

# Database migration
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy

# View logs
eb logs --all
aws logs tail /aws/elasticbeanstalk/pulsemate-backend --follow

# Rollback
eb deploy --version previous-version
```

---

## Troubleshooting

### Issue 1: Backend Health Check Failing

**Symptom:** Environment shows "Degraded"

**Solution:**
```bash
# Check logs
eb logs

# Verify health endpoint
curl https://api.pulsemateconnect.in/health

# Update health check path in EB console
# Path: /health
# Timeout: 5 seconds
# Interval: 30 seconds
```

### Issue 2: Database Connection Timeout

**Symptom:** "Error: connect ETIMEDOUT"

**Solution:**
- Check RDS security group allows EB security group
- Verify DATABASE_URL is correct
- Test connection: `psql $DATABASE_URL`

### Issue 3: Frontend 404 on Refresh

**Symptom:** React routes show 404 when refreshed

**Solution:**
- CloudFront error pages: 404 → /index.html (200)
- S3 website error document: index.html

### Issue 4: CORS Errors

**Symptom:** "Access-Control-Allow-Origin" error

**Solution:**
```javascript
// backend/src/server.js
app.use(cors({
  origin: ['https://pulsemateconnect.in', 'https://www.pulsemateconnect.in'],
  credentials: true
}));
```

---

## Next Steps

1. **Complete Deployment:**
   ```bash
   # 1. Deploy database
   # 2. Deploy backend
   # 3. Deploy frontend
   # 4. Configure DNS
   # 5. Test end-to-end
   ```

2. **Security Hardening:**
   - [ ] Enable WAF on CloudFront
   - [ ] Set up VPC for RDS
   - [ ] Rotate all secrets
   - [ ] Enable encryption at rest

3. **Performance Optimization:**
   - [ ] Enable Redis caching
   - [ ] Configure CDN caching rules
   - [ ] Optimize database queries
   - [ ] Enable gzip compression

4. **Backup & DR:**
   - [ ] Automated RDS snapshots
   - [ ] S3 versioning
   - [ ] Cross-region replication

5. **Monitoring:**
   - [ ] Set up CloudWatch alarms
   - [ ] Configure SNS notifications
   - [ ] Enable X-Ray tracing

---

## Support Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **Elastic Beanstalk:** https://docs.aws.amazon.com/elasticbeanstalk/
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment
- **PulseMate Support:** pulsemateconnect@gmail.com

---

**Deployment Status:** Ready for AWS deployment  
**Estimated Setup Time:** 2-4 hours  
**Prerequisites:** AWS account, domain, SSL certificate

