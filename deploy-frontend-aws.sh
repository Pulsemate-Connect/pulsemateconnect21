#!/bin/bash
# PulseMate Connect - Frontend Deployment Script for AWS S3 + CloudFront

set -e

echo "🚀 PulseMate Connect - AWS Frontend Deployment"
echo "=============================================="

# Configuration
S3_BUCKET="pulsemate-frontend-prod"
CLOUDFRONT_DIST_ID="YOUR_DISTRIBUTION_ID"  # Update after CloudFront creation
REGION="ap-south-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run: aws configure${NC}"
    exit 1
fi

cd frontend

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Building production bundle...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist/ directory not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Build size:${NC}"
du -sh dist/

echo -e "${YELLOW}☁️  Syncing to S3 bucket: $S3_BUCKET${NC}"

# Upload all files except index.html with long cache
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --region $REGION \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "service-worker.js" \
  --exclude "*.map"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --region $REGION \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
if [ "$CLOUDFRONT_DIST_ID" != "YOUR_DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_DIST_ID \
      --paths "/*"
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront Distribution ID not set. Update CLOUDFRONT_DIST_ID in this script.${NC}"
fi

echo -e "${GREEN}✅ Frontend deployment complete!${NC}"
echo ""
echo "🌐 Website URL: https://pulsemateconnect.in"
echo "📦 S3 Bucket: s3://$S3_BUCKET"
echo ""
echo "⏱️  CloudFront propagation may take 5-15 minutes"
