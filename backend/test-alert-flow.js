
require('dotenv').config();
const db = require('./src/config/database');
const { sendPatientAlertNotifications, sendSMS } = require('./src/services/notifications');

console.log('🧪 Testing Alert Flow...\n');

// First, check if database is initialized
const patients = db.findAll('patients');
console.log(`📊 Found ${patients.length} patients in database`);

if (patients.length === 0) {
  console.log('❌ No patients found. Please seed the database first with "npm run seed"');
  process.exit(1);
}

// Show first patient
const testPatient = patients[0];
console.log(`\n👤 Test Patient:`);
console.log(`   ID: ${testPatient.id}`);
console.log(`   Name: ${testPatient.first_name} ${testPatient.last_name}`);
console.log(`   Phone: ${testPatient.phone || 'NOT SET'}`);

// First, let's directly test sendSMS
console.log(`\n--- TEST 1: Direct SMS Test ---`);

async function runTests() {
  // Test 1: Direct SMS to your number
  try {
    console.log(`\n📱 Sending direct test SMS to your number: +19714637569`);
    const result = await sendSMS('+19714637569', '🔔 Test from ECG Platform - Direct SMS test!');
    console.log(`Result:`, result);
  } catch (e) {
    console.error(`Error in direct SMS test:`, e);
  }

  // Test 2: Full alert flow
  console.log(`\n--- TEST 2: Full Alert Flow ---`);
  try {
    const alertData = {
      patient_id: testPatient.id,
      doctor_id: testPatient.doctor_id,
      rhythm_class: 'AFIB',
      cvd_risk_score: 85,
      risk_level: 'HIGH'
    };
    
    console.log(`🔔 Triggering alert for patient...`);
    const result = await sendPatientAlertNotifications(testPatient.id, alertData);
    console.log(`Alert result:`, result);
    
  } catch (e) {
    console.error(`Error in alert flow:`, e);
  }

  console.log(`\n✅ All tests completed!`);
}

runTests();
