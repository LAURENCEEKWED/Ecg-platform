
# SMS Alert Troubleshooting Guide

## Issues Found & Fixed

1. ✅ **Twilio package not installed** - Added to `package.json`
2. ✅ **Phone number updated** - Changed to your real number: +19714637569  
3. ✅ **Added detailed logging** - Now you can see exactly what's happening

## How to Test

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Seed Database (if needed)
```bash
npm run seed
```

### Step 3: Test Direct SMS
```bash
node test-alert-flow.js
```

### Step 4: Run the Backend
```bash
npm run dev
```

## Common Twilio Issues

### 1. Trial Account Limitations
- **Issue**: Can only send to **verified phone numbers**
- **Fix**: Verify your number at https://console.twilio.com
- **Check**: Go to Twilio Console → Phone Numbers → Verified Caller IDs

### 2. Wrong Phone Number Format
- Must use E.164 format: `+19714637569`
- **No**: `971-463-7569`, `1-971-463-7569`, `(971) 463-7569`

### 3. Insufficient Balance
- Check your Twilio balance at https://console.twilio.com

### 4. Invalid Credentials
- Verify your `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Found in Twilio Console → Dashboard

## How Alerts Work

1. ECG is uploaded or simulated with **HIGH risk** (score ≥ 67)
2. System looks up patient's phone number
3. If SMS notifications enabled → sends via Twilio
4. Falls back to simulation mode if Twilio not configured

## Check Alert Status

Alerts are stored in the database with:
- `sms_status`: `PENDING` → `DELIVERED` or `FAILED`
- `sms_delivered_at`: Timestamp if successful

## Next Steps

1. Run `npm install` in the backend folder
2. Verify your number in Twilio Console
3. Use the "Simulate ECG" feature in the doctor dashboard to trigger an alert
4. Check the backend console logs for detailed SMS sending info
