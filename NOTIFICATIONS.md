# Real Email & SMS Notifications Setup

The ECG Platform is now set up to send real email and SMS notifications! Here's how to configure it:

## Step 1: Install Dependencies
You've already done this! We installed:
- nodemailer for emails
- twilio for SMS

## Step 2: Configure Email (Gmail Example)

1. Go to your Google Account Security Settings
2. Enable 2-Step Verification if not already enabled
3. Create an "App password" (search in Google Account settings)
4. Edit `backend/.env` and add your email credentials:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM="ECG Platform" <your-email@gmail.com>
```

## Step 3: Configure SMS (Twilio Example)

1. Sign up for a free Twilio account at https://www.twilio.com/try-twilio
2. Get your Account SID and Auth Token from the Twilio Console
3. Get a Twilio phone number (free trial available)
4. Edit `backend/.env` and add your Twilio credentials:
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

## Step 4: Restart the Backend Server!

After updating `backend/.env`, restart the backend server for changes to take effect!

## Testing it out!
1. Log in as a doctor
2. Select a patient and click "⚠️ Trigger Alert"
3. Watch the backend console (and your phone/email for real messages!)!

The notification service automatically switches to real mode when valid credentials are detected!
