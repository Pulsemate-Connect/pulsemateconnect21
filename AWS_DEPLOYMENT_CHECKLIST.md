# PulseMate Connect - AWS Deployment Checklist

**Use this checklist to track your AWS deployment progress.**

---

## 📋 Pre-Deployment (30 minutes)

- [ ] **AWS Account Setup**
  - [ ] AWS account created
  - [ ] Billing alerts configured
  - [ ] MFA enabled on root account
  - [ ] IAM user with admin access created
  - [ ] AWS CLI installed: `aws --version`
  - [ ] AWS CLI configured: `aws configure`

- [ ] **Domain Setup**
  - [ ] Domain purchased (pulsemateconnect.in)
  - [ ] Domain nameservers ready to change

- [ ] **Local Testing**
  - [ ] Backend running locally: `cd backend && npm run dev`
  - [ ] Frontend running locally: `cd frontend && npm run dev`
  - [ ] All tests passing: `npm test`
  - [ ] Environment variables documented

---

## 🗄️ Database Setup - RDS PostgreSQL (20 minutes)

- [ ] **Create RDS Instance**
  - [ ] Instance created: `pulsemate-db-prod`
  - [ ] Engine: PostgreSQL 15.4
  - [ ] Instance class: `db.t3.micro` or `db.t3.small`
  - [ ] Storage: 20 GB minimum
  - [ ] Master username: `postgres`
  - [ ] Strong password generated and saved
  - [ ] Public access: Enabled (temporarily)
  - [ ] Security group configured (port 5432)

- [ ] **Get Connection Details**
  - [ ] RDS endpoint saved: `______.rds.amazonaws.com`
  - [ ] Connection string format verified
  - [ ] Test connection: `psql $DATABASE_URL`

- [ ] **Initialize Database**
  - [ ] Prisma migration run: `npx prisma db push`
  - [ ] Tables created successfully
  - [ ] Seed data loaded (if needed)
  - [ ] Prisma Studio tested: `npx prisma studio`

---

## 🚀 Backend Deployment - Elastic Beanstalk (30 minutes)

- [ ] **Install EB CLI**
  - [ ] EB CLI installed: `pip install awsebcli --upgrade`
  - [ ] EB CLI verified: `eb --version`

- [ ] **Prepare Backend**
  - [ ] `.ebignore` file created
  - [ ] `Procfile` created
  - [ ] `.ebextensions/` configs created
  - [ ] `backend/.env.production` template updated

- [ ] **Initialize & Deploy**
  - [ ] EB initialized: `eb init -p node.js-18`
  - [ ] Environment created: `eb create pulsemate-backend-prod`
  - [ ] Environment variables set: `eb setenv ...`
  - [ ] Deployment successful
  - [ ] Health check passing: `eb health`

- [ ] **Test Backend**
  - [ ] Backend URL saved: `______.elasticbeanstalk.com`
  - [ ] Health endpoint working: `/health`
  - [ ] API endpoint working: `/api/health`
  - [ ] Logs checked: `eb logs`

---

## 🌐 Frontend Deployment - S3 + CloudFront (40 minutes)

- [ ] **Create S3 Bucket**
  - [ ] Bucket created: `pulsemate-frontend-prod`
  - [ ] Static website hosting enabled
  - [ ] Bucket policy configured (public read)
  - [ ] CORS configuration applied

- [ ] **Build & Upload Frontend**
  - [ ] `.env.production` updated with backend URL
  - [ ] Build successful: `npm run build`
  - [ ] Files uploaded to S3: `aws s3 sync dist/ ...`
  - [ ] S3 website URL tested

- [ ] **Create CloudFront Distribution**
  - [ ] Distribution created
  - [ ] Origin: S3 bucket
  - [ ] HTTPS redirect enabled
  - [ ] Default root object: `index.html`
  - [ ] Custom error pages: 404 → index.html (200)
  - [ ] Distribution deployed (wait 15 minutes)
  - [ ] CloudFront URL saved: `d_______.cloudfront.net`

---

## 🔒 SSL Certificate (15 minutes)

- [ ] **Request Certificate**
  - [ ] Certificate Manager opened (us-east-1 region)
  - [ ] Certificate requested for:
    - [ ] `pulsemateconnect.in`
    - [ ] `*.pulsemateconnect.in`
  - [ ] Validation method: DNS
  - [ ] DNS validation records added to Route 53
  - [ ] Certificate status: Issued

---

## 🌍 DNS Configuration - Route 53 (20 minutes)

- [ ] **Create Hosted Zone**
  - [ ] Hosted zone created: `pulsemateconnect.in`
  - [ ] Nameservers saved
  - [ ] Domain registrar nameservers updated

- [ ] **Add DNS Records**
  - [ ] A record for root domain → CloudFront
  - [ ] A record for `www` → CloudFront
  - [ ] CNAME record for `api` → Elastic Beanstalk
  - [ ] DNS propagation verified: `nslookup pulsemateconnect.in`

---

## 🔧 Update CloudFront with SSL (15 minutes)

- [ ] **Configure CloudFront**
  - [ ] Alternate domain names (CNAMEs) added:
    - [ ] `pulsemateconnect.in`
    - [ ] `www.pulsemateconnect.in`
  - [ ] SSL certificate selected from ACM
  - [ ] Changes saved
  - [ ] Waited for propagation (15 minutes)

---

## 🔄 Update Backend Configuration (10 minutes)

- [ ] **Update Environment Variables**
  - [ ] `FRONTEND_URL=https://pulsemateconnect.in`
  - [ ] `BACKEND_URL=https://api.pulsemateconnect.in`
  - [ ] Backend redeployed: `eb deploy`
  - [ ] CORS configuration verified

---

## ✅ Final Testing (15 minutes)

- [ ] **Backend Testing**
  - [ ] Health check: `https://api.pulsemateconnect.in/health`
  - [ ] API endpoint: `https://api.pulsemateconnect.in/api/health`
  - [ ] Database connectivity verified
  - [ ] Logs showing no errors

- [ ] **Frontend Testing**
  - [ ] Website loads: `https://pulsemateconnect.in`
  - [ ] All pages accessible
  - [ ] No CORS errors in console
  - [ ] Images loading correctly
  - [ ] API calls successful

- [ ] **End-to-End Testing**
  - [ ] Patient registration works
  - [ ] Doctor login works
  - [ ] Clinic owner dashboard loads
  - [ ] Appointment booking works
  - [ ] Payment flow works (test mode)
  - [ ] Queue management works
  - [ ] Notifications work

---

## 📊 Monitoring Setup (Optional, 20 minutes)

- [ ] **CloudWatch Alarms**
  - [ ] CPU usage alarm configured
  - [ ] Memory usage alarm configured
  - [ ] Error rate alarm configured
  - [ ] SNS topic for notifications created

- [ ] **Logging**
  - [ ] CloudWatch log group created
  - [ ] Log retention policy set (30 days)
  - [ ] Application logs flowing

---

## 🔐 Security Hardening (Optional, 30 minutes)

- [ ] **Secrets Rotation**
  - [ ] New JWT_SECRET generated
  - [ ] New JWT_ACCESS_SECRET generated
  - [ ] New JWT_REFRESH_SECRET generated
  - [ ] New COOKIE_SECRET generated
  - [ ] All secrets updated in EB

- [ ] **Network Security**
  - [ ] RDS moved to private subnet (if possible)
  - [ ] Security groups tightened
  - [ ] VPC configured properly

- [ ] **Application Security**
  - [ ] Rate limiting enabled
  - [ ] CORS properly configured
  - [ ] CSP headers configured
  - [ ] WAF enabled on CloudFront (optional)

---

## 🎯 Post-Deployment (20 minutes)

- [ ] **Documentation**
  - [ ] Deployment date recorded
  - [ ] All URLs documented
  - [ ] Credentials saved securely
  - [ ] Team notified

- [ ] **Backup Strategy**
  - [ ] RDS automated backups verified (7 days)
  - [ ] Manual snapshot taken
  - [ ] Backup restoration tested

- [ ] **Performance**
  - [ ] Page load times tested
  - [ ] API response times checked
  - [ ] CDN caching verified
  - [ ] Database query performance checked

- [ ] **Cost Monitoring**
  - [ ] Billing alerts configured
  - [ ] Cost Explorer checked
  - [ ] Budget set

---

## 📝 Deployment Information

Fill this out during deployment:

```
Deployment Date: _______________
Deployed By: _______________

AWS Account ID: _______________
AWS Region: ap-south-1

RDS Endpoint: _______________
RDS Password: _______________ (stored in password manager)

Elastic Beanstalk URL: _______________
CloudFront Distribution ID: _______________

Frontend URL: https://pulsemateconnect.in
Backend API URL: https://api.pulsemateconnect.in

Estimated Monthly Cost: $_______________
```

---

## 🆘 Emergency Contacts

- **AWS Support:** Console → Support Center
- **Technical Issues:** pulsemateconnect@gmail.com
- **Domain Registrar:** _______________

---

## 🔄 Deployment Scripts

After initial setup, use these for updates:

```powershell
# Backend update
.\deploy-backend-aws.ps1

# Frontend update  
.\deploy-frontend-aws.ps1
```

---

## ✨ Success Criteria

Your deployment is successful when:

✅ Website accessible at https://pulsemateconnect.in  
✅ API accessible at https://api.pulsemateconnect.in  
✅ SSL certificate valid (green lock icon)  
✅ All application features working  
✅ No console errors  
✅ Database connected and responsive  
✅ Payment gateway working (test mode)  
✅ Mobile app can connect to API  

---

**Total Estimated Time:** 3-4 hours  
**Skill Level Required:** Intermediate  
**Cost:** $40-100/month

---

**Need help?** Refer to `AWS_DEPLOYMENT_GUIDE.md` or `AWS_QUICK_START.md`
