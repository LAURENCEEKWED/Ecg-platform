
const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

console.log('🧪 Testing database...');
console.log('✅ Database loaded');
console.log('');

console.log('👥 Users in database:');
const users = db.findAll('users');
users.forEach(u => {
  console.log(`  - ${u.email} (${u.role})`);
});
console.log('');

if (users.length === 0) {
  console.log('❌ No users found! Initializing database...');
  require('./src/utils/dbInit').initializeDatabase().then(() => {
    const newUsers = db.findAll('users');
    console.log('✅ Database initialized!');
    console.log('👥 New users in database:');
    newUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });
  });
} else {
  console.log('✅ Users exist! Testing password...');
  const testUser = db.findOne('users', { email: 'emmanuel.b@email.cm' });
  if (testUser) {
    bcrypt.compare('patient123', testUser.password).then(valid => {
      if (valid) {
        console.log('✅ Password matches! Login works!');
        console.log('');
        console.log('Now you can start the backend normally!');
      } else {
        console.log('❌ Password does not match! Resetting database...');
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, './data/ecg_platform.db');
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }
        console.log('Old database deleted! Restart the backend!');
      }
    });
  } else {
    console.log('❌ Test user not found! Initializing database...');
    require('./src/utils/dbInit').initializeDatabase().then(() => {
      console.log('✅ Database initialized!');
    });
  }
}
