
// =========================================
// SIMPLE TWILIO TEST - COPY AND RUN THIS!
// =========================================

console.log('🧪 ECG Platform SMS Test\n');

// Step 1: Check environment variables
console.log('📋 Checking your configuration...');

const twilioSid = 'AC60612c4cd7a996dfab7e7f66edc63fba';
const twilioToken = '6c694ce78fd0abd14d1b60c5eca9a148';
const twilioFrom = '+19714637569';
const yourPhone = '+19714637569';

console.log('✅ Configuration loaded');
console.log(`   From: ${twilioFrom}`);
console.log(`   To: ${yourPhone}`);

// Step 2: Try to load twilio
console.log('\n📦 Loading Twilio library...');
let twilio;
try {
  twilio = require('twilio');
  console.log('✅ Twilio library loaded');
} catch (e) {
  console.error('❌ Twilio not installed!');
  console.error('   Run: npm.cmd install twilio nodemailer');
  process.exit(1);
}

// Step 3: Send SMS
console.log('\n📱 Sending test SMS...');

const client = twilio(twilioSid, twilioToken);

client.messages.create({
  body: '🔔 SUCCESS! Your ECG Platform SMS is working!',
  from: twilioFrom,
  to: yourPhone
})
.then(message => {
  console.log('\n✅🎉 SMS SENT SUCCESSFULLY!');
  console.log(`   Message SID: ${message.sid}`);
  console.log(`   Check your phone (+19714637569)`);
  console.log('\nNow you can start the backend: npm.cmd run dev');
})
.catch(error => {
  console.error('\n❌ ERROR SENDING SMS:');
  console.error(`   Code: ${error.code}`);
  console.error(`   Message: ${error.message}`);
  console.error('\n💡 Common fixes:');
  console.error('   1. Verify your number in Twilio Console');
  console.error('   2. Make sure you have Twilio balance');
  console.error('   3. Check Twilio Console logs: https://console.twilio.com');
});
