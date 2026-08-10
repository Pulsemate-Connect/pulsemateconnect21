#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# PulseMate Connect - Notification System Test Script
# ═══════════════════════════════════════════════════════════════════════════════
# 
# This script tests the complete notification system pipeline
# 
# REQUIREMENTS:
# 1. You must be logged in (have a valid JWT token)
# 2. Firebase must be configured in Render
# 3. Mobile app must have registered a device token
#
# USAGE:
#   bash test-notifications.sh YOUR_JWT_TOKEN
#
# ═══════════════════════════════════════════════════════════════════════════════

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_URL="https://api.pulsemateconnect.in/api"

# Check if JWT token provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ ERROR: JWT token required${NC}"
  echo ""
  echo "USAGE:"
  echo "  bash test-notifications.sh YOUR_JWT_TOKEN"
  echo ""
  echo "HOW TO GET YOUR JWT TOKEN:"
  echo "  1. Login to PulseMate app (web or mobile)"
  echo "  2. Open browser console / DevTools"
  echo "  3. Run: localStorage.getItem('token')"
  echo "  4. Copy the token (without quotes)"
  exit 1
fi

JWT_TOKEN="$1"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PulseMate Connect - Notification System Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: Check Firebase Configuration Status
# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[TEST 1/3]${NC} Checking Firebase Admin SDK configuration..."
echo ""

FIREBASE_RESPONSE=$(curl -s -X GET "${API_URL}/notifications/firebase-status" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$FIREBASE_RESPONSE" | jq '.'
echo ""

# Parse response
CONFIGURED=$(echo "$FIREBASE_RESPONSE" | jq -r '.data.configured')
INITIALIZED=$(echo "$FIREBASE_RESPONSE" | jq -r '.data.initialized')
MODE=$(echo "$FIREBASE_RESPONSE" | jq -r '.data.mode')

if [ "$CONFIGURED" = "true" ] && [ "$INITIALIZED" = "true" ]; then
  echo -e "${GREEN}✅ Firebase is properly configured and initialized${NC}"
  echo -e "${GREEN}✅ Mode: $MODE${NC}"
else
  echo -e "${RED}❌ Firebase is NOT configured${NC}"
  echo -e "${RED}❌ Mode: $MODE${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  ACTION REQUIRED:${NC}"
  echo "   Configure FIREBASE_SERVICE_ACCOUNT_JSON in Render"
  echo "   See: URGENT-FIREBASE-SETUP-REQUIRED.md"
  echo ""
  echo "Push notifications will NOT work until Firebase is configured."
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo -e "${BLUE}───────────────────────────────────────────────────────────────────────────────${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: Check Registered FCM Tokens
# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[TEST 2/3]${NC} Checking registered FCM tokens..."
echo ""

TOKENS_RESPONSE=$(curl -s -X GET "${API_URL}/notifications/tokens" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$TOKENS_RESPONSE" | jq '.'
echo ""

# Parse response
TOKEN_COUNT=$(echo "$TOKENS_RESPONSE" | jq -r '.data.count')

if [ "$TOKEN_COUNT" = "0" ] || [ "$TOKEN_COUNT" = "null" ]; then
  echo -e "${RED}❌ No FCM tokens registered${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  POSSIBLE CAUSES:${NC}"
  echo "   1. Mobile app not updated (still using wrong API endpoint)"
  echo "   2. User not logged in on mobile device"
  echo "   3. Mobile app not installed"
  echo ""
  echo -e "${YELLOW}⚠️  ACTION REQUIRED:${NC}"
  echo "   1. Update mobile app with API fix"
  echo "   2. Login to mobile app"
  echo "   3. Check app logs for token registration"
  echo ""
  echo "Test notification will likely fail."
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ Found $TOKEN_COUNT registered token(s)${NC}"
  echo ""
  echo "Registered devices:"
  echo "$TOKENS_RESPONSE" | jq -r '.data.tokens[] | "  • \(.platform) - Registered: \(.registeredAt)"'
fi

echo ""
echo -e "${BLUE}───────────────────────────────────────────────────────────────────────────────${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: Send Test Notification
# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[TEST 3/3]${NC} Sending test notification..."
echo ""

TEST_RESPONSE=$(curl -s -X POST "${API_URL}/notifications/test" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$TEST_RESPONSE" | jq '.'
echo ""

# Parse response
SUCCESS=$(echo "$TEST_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Test notification sent successfully!${NC}"
  echo ""
  echo -e "${GREEN}📱 CHECK YOUR MOBILE DEVICE NOW${NC}"
  echo "   You should see a notification: '🔔 Test Notification'"
  echo ""
  echo "If you received the notification:"
  echo -e "  ${GREEN}✓${NC} Firebase is working"
  echo -e "  ${GREEN}✓${NC} Token registration is working"
  echo -e "  ${GREEN}✓${NC} Push notification pipeline is working"
  echo -e "  ${GREEN}✓${NC} Mobile app is receiving notifications"
else
  echo -e "${RED}❌ Test notification FAILED${NC}"
  echo ""
  ERROR_MSG=$(echo "$TEST_RESPONSE" | jq -r '.message // .error // "Unknown error"')
  echo -e "${RED}Error: $ERROR_MSG${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  TROUBLESHOOTING:${NC}"
  echo "   1. Check backend logs in Render dashboard"
  echo "   2. Verify Firebase configuration"
  echo "   3. Verify token is registered (see Test 2 above)"
  echo "   4. Check Android notification permissions"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Test Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}SUMMARY:${NC}"
echo ""
echo "Firebase Configuration:  $([ "$CONFIGURED" = "true" ] && echo -e "${GREEN}✓ Configured${NC}" || echo -e "${RED}✗ Not configured${NC}")"
echo "Firebase Initialized:    $([ "$INITIALIZED" = "true" ] && echo -e "${GREEN}✓ Yes${NC}" || echo -e "${RED}✗ No${NC}")"
echo "FCM Tokens Registered:   $([ "$TOKEN_COUNT" != "0" ] && [ "$TOKEN_COUNT" != "null" ] && echo -e "${GREEN}✓ $TOKEN_COUNT token(s)${NC}" || echo -e "${RED}✗ No tokens${NC}")"
echo "Test Notification Sent:  $([ "$SUCCESS" = "true" ] && echo -e "${GREEN}✓ Sent${NC}" || echo -e "${RED}✗ Failed${NC}")"
echo ""

if [ "$CONFIGURED" = "true" ] && [ "$INITIALIZED" = "true" ] && [ "$TOKEN_COUNT" != "0" ] && [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ ALL TESTS PASSED - NOTIFICATION SYSTEM IS WORKING!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "You can now test real-world scenarios:"
  echo "  • Book an appointment → Check notifications"
  echo "  • Cancel an appointment → Check notifications"
  echo "  • Doctor calls queue → Check notifications"
else
  echo -e "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ⚠️  SOME TESTS FAILED - ACTION REQUIRED${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "See above for specific actions required."
  echo "Refer to: URGENT-FIREBASE-SETUP-REQUIRED.md"
fi

echo ""
