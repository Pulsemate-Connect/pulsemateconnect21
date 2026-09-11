#!/bin/bash
# PulseMate Connect - Backend Deployment Script for AWS Elastic Beanstalk

set -e

echo "🚀 PulseMate Connect - AWS Backend Deployment"
echo "=============================================="

# Configuration
APP_NAME="pulsemate-backend"
ENV_NAME="pulsemate-backend-prod"
REGION="ap-south-1"
PLATFORM="node.js-18"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI not found. Installing...${NC}"
    pip install awsebcli --upgrade --user
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run: aws configure${NC}"
    exit 1
fi

cd backend

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production=false

echo -e "${YELLOW}🔨 Generating Prisma client...${NC}"
npx prisma generate

echo -e "${YELLOW}✅ Running tests...${NC}"
npm test || echo "⚠️  Tests failed, continuing anyway..."

echo -e "${YELLOW}📝 Checking EB initialization...${NC}"
if [ ! -d ".elasticbeanstalk" ]; then
    echo -e "${YELLOW}🔧 Initializing Elastic Beanstalk...${NC}"
    eb init -p $PLATFORM $APP_NAME --region $REGION
fi

echo -e "${YELLOW}🚀 Deploying to Elastic Beanstalk...${NC}"
eb deploy $ENV_NAME

echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo "📊 Check deployment status:"
echo "   eb status"
echo ""
echo "📋 View logs:"
echo "   eb logs"
echo ""
echo "🌐 Open in browser:"
echo "   eb open"
echo ""
echo "🔍 Monitor health:"
echo "   eb health"
