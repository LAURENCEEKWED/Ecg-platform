
const { initializeDatabase } = require('./dbInit');

console.log('🌱 Seeding database...');
initializeDatabase().then(() => {
  console.log('✅ Seed complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
