
require('dotenv').config();
const twilio = require('twilio');

console.log('📱 Testing Twilio SMS Configuration...\n');

// Check environment variables
const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_FROM_NUMBER'
];

console.log('📋 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
});

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`\n❌ Missing required variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

console.log('\n🚀 Attempting to send test SMS...');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const testPhoneNumber = '+19714637569'; // Your phone number

async function sendTestSMS() {
  try {
    const message = await client.messages.create({
      body: '🔔 Test SMS from ECG Platform - If you received this, Twilio is working correctly!',
      from: process.env.TWILIO_FROM_NUMBER,
      to: testPhoneNumber
    });
    
    console.log(`✅ SMS Sent Successfully!`);
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   From: ${process.env.TWILIO_FROM_NUMBER}`);
    console.log(`   To: ${testPhoneNumber}`);
    console.log(`   Status: ${message.status}`);
    
  } catch (error) {
    console.error(`\n❌ Error sending SMS:`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   More Info: ${error.moreInfo}`);
    
    console.log(`\n💡 Common issues:`);
    console.log(`   - Is your Twilio phone number verified?`);
    console.log(`   - Are you using a trial account? (Only verified numbers work)`);
    console.log(`   - Is the recipient phone number in E.164 format?`);
    console.log(`   - Check Twilio Console: https://console.twilio.com`);
  }
}

sendTestSMS();
