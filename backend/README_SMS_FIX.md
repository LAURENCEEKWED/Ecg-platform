
# ✅ HOW TO GET SMS ALERTS WORKING - 3 EASY STEPS

---

## STEP 1: OPEN COMMAND PROMPT IN THIS FOLDER

```
cd c:\Users\user\Desktop\ecg-platform\backend
```

---

## STEP 2: INSTALL TWILIO (do this ONCE)

```
npm.cmd install twilio nodemailer
```

---

## STEP 3: RUN THE FIX & TEST SCRIPT

```
node FIX_AND_TEST.js
```

That's it! This script will:
- ✅ Update all patients to use YOUR phone number (+19714637569)
- ✅ Send you a direct test SMS
- ✅ Test the full alert flow
- ✅ Show detailed logs so you see exactly what's happening

---

## IF IT WORKS: START THE BACKEND

```
npm.cmd run dev
```

Now when HIGH-risk ECGs come in (risk ≥ 67), you'll get SMS alerts!

---

## ⚠️ IF IT DOESN'T WORK: CHECK THESE

1. **Verify your phone in Twilio** (trial accounts only):
   - Go to: https://console.twilio.com
   - Phone Numbers → Verified Caller IDs
   - Make sure +19714637569 is verified

2. **Check Twilio balance** (you need a small balance)

3. **Check Twilio error logs** at https://console.twilio.com

4. **Phone number format**: Always use +19714637569 (E.164 format)

---

## WHAT'S BEEN FIXED:

1. ✅ Changed Twilio FROM number to your real number
2. ✅ Fixed config check timing issue
3. ✅ Added detailed logging
4. ✅ Created scripts to automatically update patients
5. ✅ Added comprehensive test scripts
