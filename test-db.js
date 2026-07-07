
const db = require('./backend/src/config/database');

console.log('🔍 TESTING DATABASE...');
console.log('Tables:', Object.keys(db.tables));
console.log('Users count:', db.tables.users.length);

if (db.tables.users.length > 0) {
  console.log('Users found:', db.tables.users.map(u => ({ email: u.email, role: u.role })));
} else {
  console.log('❌ No users found!');
}
