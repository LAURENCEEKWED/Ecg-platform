
const db = require('./src/config/database');

console.log('📱 Updating test patient phone number...\n');

const patients = db.findAll('patients');

if (patients.length === 0) {
  console.log('❌ No patients found. Run "npm run seed" first.');
  process.exit(1);
}

const yourPhoneNumber = '+19714637569';
const testPatient = patients[0];

console.log(`👤 Patient: ${testPatient.first_name} ${testPatient.last_name}`);
console.log(`   Old phone: ${testPatient.phone || 'NOT SET'}`);
console.log(`   New phone: ${yourPhoneNumber}`);

// Update patient
db.update('patients', testPatient.id, {
  phone: yourPhoneNumber
});

// Also update user record
const user = db.findById('users', testPatient.user_id);
if (user) {
  db.update('users', user.id, {
    phone: yourPhoneNumber
  });
}

console.log('\n✅ Patient phone number updated successfully!');
console.log(`   Now you can test SMS alerts for this patient.`);
