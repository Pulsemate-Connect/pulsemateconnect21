# PulseMate Connect - Frontend Deployment Script for AWS S3 + CloudFront (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🚀 PulseMate Connect - AWS Frontend Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Configuration
$S3_BUCKET = "pulsemate-frontend-prod"
$CLOUDFRONT_DIST_ID = "YOUR_DISTRIBUTION_ID"  # Update after CloudFront creation
$REGION = "ap-south-1"

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

Set-Location frontend

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Building production bundle..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist/ directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Build size:" -ForegroundColor Yellow
$distSize = (Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "$([math]::Round($distSize, 2)) MB"

Write-Host "☁️  Syncing to S3 bucket: $S3_BUCKET" -ForegroundColor Yellow

# Upload all files except index.html with long cache
aws s3 sync dist/ "s3://$S3_BUCKET/" `
  --region $REGION `
  --delete `
  --cache-control "public, max-age=31536000, immutable" `
  --exclude "index.html" `
  --exclude "service-worker.js" `
  --exclude "*.map"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" `
  --region $REGION `
  --cache-control "no-cache, no-store, must-revalidate" `
  --content-type "text/html"

Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
if ($CLOUDFRONT_DIST_ID -ne "YOUR_DISTRIBUTION_ID") {
    aws cloudfront create-invalidation `
      --distribution-id $CLOUDFRONT_DIST_ID `
      --paths "/*"
    Write-Host "✅ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "⚠️  CloudFront Distribution ID not set. Update CLOUDFRONT_DIST_ID in this script." -ForegroundColor Yellow
}

Write-Host "✅ Frontend deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Website URL: https://pulsemateconnect.in"
Write-Host "📦 S3 Bucket: s3://$S3_BUCKET"
Write-Host ""
Write-Host "⏱️  CloudFront propagation may take 5-15 minutes"
