# PulseMate Connect - Backend Deployment Script for AWS Elastic Beanstalk (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🚀 PulseMate Connect - AWS Backend Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Configuration
$APP_NAME = "pulsemate-backend"
$ENV_NAME = "pulsemate-backend-prod"
$REGION = "ap-south-1"
$PLATFORM = "node.js-18"

# Check if EB CLI is installed
if (-not (Get-Command eb -ErrorAction SilentlyContinue)) {
    Write-Host "❌ EB CLI not found. Installing..." -ForegroundColor Red
    pip install awsebcli --upgrade --user
}

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

Set-Location backend

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --production=false

Write-Host "🔨 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "✅ Running tests..." -ForegroundColor Yellow
try {
    npm test
} catch {
    Write-Host "⚠️  Tests failed, continuing anyway..." -ForegroundColor Yellow
}

Write-Host "📝 Checking EB initialization..." -ForegroundColor Yellow
if (-not (Test-Path ".elasticbeanstalk")) {
    Write-Host "🔧 Initializing Elastic Beanstalk..." -ForegroundColor Yellow
    eb init -p $PLATFORM $APP_NAME --region $REGION
}

Write-Host "🚀 Deploying to Elastic Beanstalk..." -ForegroundColor Yellow
eb deploy $ENV_NAME

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Check deployment status:"
Write-Host "   eb status"
Write-Host ""
Write-Host "📋 View logs:"
Write-Host "   eb logs"
Write-Host ""
Write-Host "🌐 Open in browser:"
Write-Host "   eb open"
Write-Host ""
Write-Host "🔍 Monitor health:"
Write-Host "   eb health"
