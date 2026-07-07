
const db = require('./backend/src/config/database');

console.log('🔄 Updating patient phone number...');

// Find the first patient (Emmanuel Biya)
const patients = db.findAll('patients');
if (patients.length > 0) {
  const patient = patients[0];
  console.log('Found patient:', patient.first_name, patient.last_name);
  
  // Update phone number
  db.update('patients', patient.id, { phone: '+237678961518' });
  
  // Also update the user record
  if (patient.user_id) {
    db.update('users', patient.user_id, { phone: '+237678961518' });
  }
  
  console.log('✅ Updated phone number to: +237678961518');
} else {
  console.log('❌ No patients found!');
}
