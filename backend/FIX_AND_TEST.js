
// =========================================
// ULTIMATE SMS FIX & TEST SCRIPT
// =========================================

console.log('🚀 ===================================');
console.log('   ECG PLATFORM SMS FIX & TEST');
console.log('   ===================================\n');

// Load environment variables
require('dotenv').config();

// 1. Import dependencies
const db = require('./src/config/database');
const { sendPatientAlertNotifications, sendSMS } = require('./src/services/notifications');

// 2. Your phone number
const YOUR_PHONE = '+19714637569';
console.log(`📱 Target phone: ${YOUR_PHONE}`);

// 3. Update ALL patients to use YOUR number
console.log('\n🔧 Updating patients...');
const patients = db.findAll('patients');
patients.forEach(p => {
  db.update('patients', p.id, { phone: YOUR_PHONE });
  const user = db.findById('users', p.user_id);
  if (user) {
    db.update('users', user.id, { phone: YOUR_PHONE });
  }
  console.log(`   ✅ Updated ${p.first_name} ${p.last_name}`);
});

// 4. Quick test - direct SMS
console.log('\n📋 TEST 1: Direct SMS (quickest test)');

async function runCompleteTest() {
  try {
    // Direct SMS test first
    console.log('   Sending direct test SMS...');
    const directResult = await sendSMS(YOUR_PHONE, '🔔 ECG PLATFORM: DIRECT TEST - if you get this, Twilio is working!');
    console.log('   Direct test result:', directResult);
    
    if (directResult.success && !directResult.simulated) {
      console.log('   ✅ DIRECT SMS WORKS!');
    }

    // Full alert flow test
    console.log('\n📋 TEST 2: Full Alert Flow');
    const testPatient = patients[0];
    
    const alertData = {
      patient_id: testPatient.id,
      rhythm_class: 'AFIB',
      cvd_risk_score: 92,
      risk_level: 'HIGH'
    };
    
    console.log(`   Testing with patient: ${testPatient.first_name} ${testPatient.last_name}`);
    const alertResult = await sendPatientAlertNotifications(testPatient.id, alertData);
    console.log('   Alert result:', alertResult);

    console.log('\n🎉 ===================================');
    console.log('   TESTING COMPLETED!');
    console.log('   ===================================\n');
    
    console.log('💡 If you got the SMS messages:');
    console.log('   1. Your Twilio setup is WORKING!');
    console.log('   2. Now start the backend: npm.cmd run dev');
    console.log('   3. Trigger high-risk ECGs, patients will get SMS!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
  }
}

runCompleteTest();
