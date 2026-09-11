# PulseMate Connect - AWS Quick Start Guide

**Quick deployment guide to get PulseMate Connect running on AWS in under 2 hours.**

---

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Domain registered (pulsemateconnect.in)
- [ ] Node.js 18+ installed locally

---

## Step 1: Install AWS Tools (5 minutes)

```powershell
# Install AWS CLI (if not installed)
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1
# - Output format: json

# Install Elastic Beanstalk CLI
pip install awsebcli --upgrade --user

# Verify installation
aws --version
eb --version
```

---

## Step 2: Create RDS Database (15 minutes)

### Option A: Using AWS Console (Recommended)

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **Create database**
3. Configuration:
   - **Engine:** PostgreSQL 15.4
   - **Template:** Free tier (or Production if needed)
   - **DB instance identifier:** `pulsemate-db-prod`
   - **Master username:** `postgres`
   - **Master password:** Create strong password
   - **DB instance class:** `db.t3.micro` (free tier)
   - **Storage:** 20 GB SSD
   - **Public access:** Yes (temporarily, for setup)
   - **VPC security group:** Create new → allow port 5432
4. Click **Create database**
5. **Wait 10-15 minutes** for creation

### Option B: Using AWS CLI

```powershell
aws rds create-db-instance `
  --db-instance-identifier pulsemate-db-prod `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 15.4 `
  --master-username postgres `
  --master-user-password "YOUR_STRONG_PASSWORD" `
  --allocated-storage 20 `
  --publicly-accessible `
  --backup-retention-period 7 `
  --storage-encrypted
```

### Get Database Endpoint

```powershell
# Once created, get the endpoint
aws rds describe-db-instances `
  --db-instance-identifier pulsemate-db-prod `
  --query "DBInstances[0].Endpoint.Address" `
  --output text
```

**Save this endpoint!** Format: `pulsemate-db-prod.xxxxxx.ap-south-1.rds.amazonaws.com`

---

## Step 3: Initialize Database Schema (10 minutes)

```powershell
# Set environment variable
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres"

# Navigate to backend
cd backend

# Run Prisma migration
npx prisma db push

# Verify connection
npx prisma studio
# Should open browser showing database tables
```

---

## Step 4: Deploy Backend to Elastic Beanstalk (20 minutes)

```powershell
cd backend

# Initialize EB application
eb init -p node.js-18 pulsemate-backend --region ap-south-1

# Create environment and deploy
eb create pulsemate-backend-prod `
  --instance-type t3.small `
  --envvars DATABASE_URL="postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/postgres",NODE_ENV=production,PORT=8080

# This will take 10-15 minutes
```

### Set All Environment Variables

```powershell
# Set remaining environment variables
eb setenv `
  JWT_SECRET="$(node -e 'console.log(require(\"crypto\").randomBytes(64).toString(\"hex\"))')" `
  JWT_ACCESS_SECRET="$(node -e 'console.log(require(\"crypto\").randomBytes(64).toString(\"hex\"))')" `
  JWT_REFRESH_SECRET="$(node -e 'console.log(require(\"crypto\").randomBytes(64).toString(\"hex\"))')" `
  COOKIE_SECRET="$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" `
  RAZORPAY_KEY_ID="rzp_live_Sz5uowTvIY9Mwv" `
  RAZORPAY_KEY_SECRET="wVhmp2dFNEQGFfytMiT5NYk1" `
  CLOUDINARY_CLOUD_NAME="pulsemateconnect" `
  CLOUDINARY_API_KEY="517831889895763" `
  CLOUDINARY_API_SECRET="kF5FqIFsR2NSQ5IIy17NAKeScXs" `
  MESSAGE_CENTRAL_CUSTOMER_ID="YOUR_MC_CUSTOMER_ID" `
  RESEND_API_KEY="YOUR_RESEND_API_KEY" `
  FRONTEND_URL="https://pulsemateconnect.in" `
  BACKEND_URL="https://api.pulsemateconnect.in"
```

### Get Backend URL

```powershell
eb status
# Note the CNAME: pulsemate-backend-prod.ap-south-1.elasticbeanstalk.com

# Test it
curl http://pulsemate-backend-prod.ap-south-1.elasticbeanstalk.com/health
```

---

## Step 5: Deploy Frontend to S3 + CloudFront (30 minutes)

### Create S3 Bucket

```powershell
# Create bucket
aws s3 mb s3://pulsemate-frontend-prod --region ap-south-1

# Enable static website hosting
aws s3 website s3://pulsemate-frontend-prod `
  --index-document index.html `
  --error-document index.html
```

### Set Bucket Policy

```powershell
# Create bucket-policy.json
@"
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
"@ | Out-File -FilePath bucket-policy.json -Encoding utf8

# Apply policy
aws s3api put-bucket-policy `
  --bucket pulsemate-frontend-prod `
  --policy file://bucket-policy.json
```

### Build and Upload Frontend

```powershell
cd ..\frontend

# Update .env.production with backend URL
$backendUrl = "http://pulsemate-backend-prod.ap-south-1.elasticbeanstalk.com"
@"
VITE_API_URL=$backendUrl/api
VITE_SOCKET_URL=$backendUrl
VITE_RAZORPAY_KEY_ID=rzp_live_Sz5uowTvIY9Mwv
"@ | Out-File -FilePath .env.production -Encoding utf8

# Build
npm install
npm run build

# Upload to S3
aws s3 sync dist/ s3://pulsemate-frontend-prod/ --delete
```

### Create CloudFront Distribution

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click **Create Distribution**
3. Configuration:
   - **Origin domain:** `pulsemate-frontend-prod.s3.ap-south-1.amazonaws.com`
   - **Viewer protocol policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP methods:** GET, HEAD, OPTIONS
   - **Compress objects:** Yes
   - **Default root object:** `index.html`
4. **Custom error responses:**
   - HTTP error code: 404
   - Customize error response: Yes
   - Response page path: `/index.html`
   - HTTP response code: 200
5. Click **Create distribution**
6. **Wait 10-15 minutes** for deployment

**Save CloudFront Domain:** `d1234abcd.cloudfront.net`

---

## Step 6: Request SSL Certificate (10 minutes)

1. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/)
2. **Switch region to:** `us-east-1` (required for CloudFront)
3. Click **Request certificate**
4. **Domain names:**
   - `pulsemateconnect.in`
   - `*.pulsemateconnect.in` (wildcard for subdomains)
5. **Validation method:** DNS validation
6. Click **Request**
7. Click **Create records in Route 53** (if domain in Route 53)
8. **Wait 5-30 minutes** for validation

---

## Step 7: Configure Route 53 DNS (15 minutes)

### Create Hosted Zone (if not exists)

```powershell
aws route53 create-hosted-zone `
  --name pulsemateconnect.in `
  --caller-reference $(Get-Date -Format "yyyyMMddHHmmss")
```

**Update your domain registrar's nameservers** with Route 53 nameservers shown in hosted zone.

### Add DNS Records

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Click on **pulsemateconnect.in** hosted zone

**Create A Record for Frontend:**
- Record name: (blank for root domain)
- Record type: A
- Alias: Yes
- Route traffic to: CloudFront distribution
- Select your CloudFront distribution
- Click **Create records**

**Create A Record for www:**
- Record name: `www`
- Record type: A
- Alias: Yes
- Route traffic to: CloudFront distribution
- Select same CloudFront distribution

**Create CNAME for API:**
- Record name: `api`
- Record type: CNAME
- Value: `pulsemate-backend-prod.ap-south-1.elasticbeanstalk.com`
- TTL: 300

---

## Step 8: Update CloudFront with SSL and Domain (10 minutes)

1. Go back to CloudFront console
2. Select your distribution
3. Click **Edit**
4. **Alternate domain names (CNAMEs):**
   - `pulsemateconnect.in`
   - `www.pulsemateconnect.in`
5. **Custom SSL certificate:**
   - Select your ACM certificate from dropdown
6. Click **Save changes**
7. **Wait 10-15 minutes** for propagation

---

## Step 9: Update Backend CORS and URLs (5 minutes)

```powershell
cd ..\backend

# Update environment variables with production URLs
eb setenv `
  FRONTEND_URL="https://pulsemateconnect.in" `
  BACKEND_URL="https://api.pulsemateconnect.in"

# Redeploy backend
eb deploy
```

---

## Step 10: Final Testing (10 minutes)

### Test Backend API

```powershell
# Health check
curl https://api.pulsemateconnect.in/health

# API endpoint
curl https://api.pulsemateconnect.in/api/health
```

### Test Frontend

1. Open browser: `https://pulsemateconnect.in`
2. Test login with existing credentials
3. Try booking an appointment
4. Check doctor dashboard
5. Verify payment flow (test mode)

---

## Deployment Scripts

Use the provided deployment scripts for updates:

### Backend Updates

```powershell
# Windows
.\deploy-backend-aws.ps1

# Linux/Mac
./deploy-backend-aws.sh
```

### Frontend Updates

```powershell
# Windows
.\deploy-frontend-aws.ps1

# Linux/Mac
./deploy-frontend-aws.sh
```

---

## Monitoring

### View Backend Logs

```powershell
eb logs
# Or real-time
eb logs --stream
```

### Check Backend Health

```powershell
eb health
eb status
```

### CloudFront Cache Invalidation

```powershell
# After frontend updates
aws cloudfront create-invalidation `
  --distribution-id YOUR_DIST_ID `
  --paths "/*"
```

---

## Costs Summary

**Estimated Monthly Costs:**

| Service | Size | Cost |
|---------|------|------|
| EC2 (t3.small) | Backend API | $15 |
| RDS (db.t3.micro) | PostgreSQL | $15 |
| S3 | Storage | $3 |
| CloudFront | CDN | $5-10 |
| Route 53 | DNS | $0.50 |
| **Total** | | **~$40/month** |

**Free Tier Eligible:**
- First 12 months: RDS, EC2 partially free
- CloudFront: 1TB free per month
- S3: 5GB free storage

---

## Troubleshooting

### Backend not responding

```powershell
# Check logs
eb logs

# SSH into instance
eb ssh

# Check environment variables
eb printenv
```

### Frontend CORS errors

- Verify `FRONTEND_URL` in backend environment variables
- Check backend CORS configuration in `src/server.js`

### Database connection timeout

- Check RDS security group allows Elastic Beanstalk security group
- Verify `DATABASE_URL` format is correct

### SSL certificate pending

- Verify DNS records in Route 53 match ACM validation records
- Wait up to 30 minutes for DNS propagation

---

## Next Steps

1. **Set up monitoring:**
   - CloudWatch alarms for CPU, memory, errors
   - SNS notifications for critical alerts

2. **Enable auto-scaling:**
   - EB console → Configuration → Capacity
   - Min: 1, Max: 3 instances

3. **Set up CI/CD:**
   - GitHub Actions for automated deployments
   - See `.github/workflows/` for templates

4. **Backup strategy:**
   - RDS automated backups (already enabled)
   - Manual snapshots before major updates

5. **Security hardening:**
   - Enable WAF on CloudFront
   - Restrict RDS to private subnet
   - Rotate all secrets

---

## Support

For deployment issues:
- Email: pulsemateconnect@gmail.com
- AWS Documentation: https://docs.aws.amazon.com/
- Elastic Beanstalk Guide: https://docs.aws.amazon.com/elasticbeanstalk/

**Deployment completed!** 🎉

Access your app at: **https://pulsemateconnect.in**
