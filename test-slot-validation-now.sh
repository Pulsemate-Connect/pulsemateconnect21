#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# PAST SLOT VALIDATION — LIVE TEST SCRIPT (Bash)
# ═══════════════════════════════════════════════════════════════════════════

API_BASE="https://api.pulsemateconnect.in"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  PULSMATE CONNECT — SLOT VALIDATION TEST"
echo "════════════════════════════════════════════════════════"
echo ""

# Get JWT Token
echo "[1] GET JWT TOKEN"
echo "────────────────────────────────────────────────────────"
echo ""
echo "Paste your JWT token (from browser DevTools):"
read JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "✗ No token provided. Exiting."
    exit 1
fi

echo "✓ Token configured!"
echo ""

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)

echo "[2] CURRENT TIME"
echo "────────────────────────────────────────────────────────"
echo "Test Date: $CURRENT_DATE (TODAY)"
echo "Current Time: $CURRENT_TIME"
echo ""

# Get doctors
echo "[3] SEARCH DOCTORS"
echo "────────────────────────────────────────────────────────"
echo "Fetching doctors..."
echo ""

DOCTORS_RESPONSE=$(curl -s "$API_BASE/api/patient/doctors?limit=5" \
    -H "Authorization: Bearer $JWT_TOKEN")

echo "Enter Doctor ID:"
read DOCTOR_ID

echo "Enter Clinic ID:"
read CLINIC_ID

echo ""

# Test 1: Get Slots
echo "[4] TEST SLOT API"
echo "────────────────────────────────────────────────────────"
echo "Fetching slots for $CURRENT_DATE..."
echo ""

SLOTS_RESPONSE=$(curl -s "$API_BASE/api/doctor/$DOCTOR_ID/slots?clinicId=$CLINIC_ID&date=$CURRENT_DATE" \
    -H "Authorization: Bearer $JWT_TOKEN")

echo "$SLOTS_RESPONSE" | jq '.'
echo ""

# Count past slots
PAST_COUNT=$(echo "$SLOTS_RESPONSE" | jq '[.data.slots[] | select(.past == true)] | length')
AVAILABLE_COUNT=$(echo "$SLOTS_RESPONSE" | jq '[.data.slots[] | select(.available == true)] | length')

echo "Past Slots: $PAST_COUNT"
echo "Available Slots: $AVAILABLE_COUNT"
echo ""

# Test 2: Try booking past slot
echo "[5] TEST BACKEND VALIDATION"
echo "────────────────────────────────────────────────────────"
echo "Enter a PAST slot time (e.g., 09:00) to test rejection:"
read PAST_SLOT

if [ -n "$PAST_SLOT" ]; then
    echo "Attempting to book past slot $PAST_SLOT..."
    echo ""
    
    BOOKING_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_BASE/api/patient/appointments" \
        -X POST \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"doctorId\": \"$DOCTOR_ID\",
            \"clinicId\": \"$CLINIC_ID\",
            \"appointmentType\": \"OFFLINE\",
            \"appointmentDate\": \"$CURRENT_DATE\",
            \"slotTime\": \"$PAST_SLOT\"
        }")
    
    HTTP_STATUS=$(echo "$BOOKING_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$BOOKING_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "Response:"
    echo "$RESPONSE_BODY" | jq '.'
    echo ""
    
    if [ "$HTTP_STATUS" = "400" ]; then
        echo "✓ Backend correctly rejected past slot (HTTP 400)"
    else
        echo "✗ Unexpected status: $HTTP_STATUS"
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  TEST COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
