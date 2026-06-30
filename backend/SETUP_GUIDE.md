
# Step-by-Step Setup Guide

## 1. Open Command Prompt or PowerShell in the backend folder

## 2. Install the required packages:

```bash
npm.cmd install twilio nodemailer
```

## 3. Verify your Twilio setup

Your credentials are already configured in `.env`:
- Account SID: `AC60612c4cd7a996dfab7e7f66edc63fba`
- Auth Token: `6c694ce78fd0abd14d1b60c5eca9a148`
- Phone Number: `+19714637569`

## 4. Update test patient's phone number (optional but recommended):

```bash
node update-patient-phone.js
```

## 5. Test SMS directly:

Create a file `simple-test.js` with this content:

```javascript
require('dotenv').config();
const twilio = require('twilio');

console.log('Testing Twilio...');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.messages.create({
  body: '🔔 Hello from ECG Platform!',
  from: process.env.TWILIO_FROM_NUMBER,
  to: '+19714637569'
})
.then(message => {
  console.log('✅ Success! Message SID:', message.sid);
})
.catch(error => {
  console.error('❌ Error:', error.message);
  console.error('Code:', error.code);
  console.error('More info:', error.moreInfo);
});
```

Then run:
```bash
node simple-test.js
```

## 6. If Twilio test works, start your backend:

```bash
npm.cmd run dev
```

## Important Twilio Notes:

- **Trial accounts** can only send to VERIFIED phone numbers
- Verify your number here: https://console.twilio.com
- Phone numbers must use E.164 format: `+19714637569`
- Check Twilio Console for error logs
