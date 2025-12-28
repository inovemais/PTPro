require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./data/users/users');
const config = require('./config');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  const users = await User.find({}).limit(10).select('email name password role');
  console.log('\n=== Users in database ===');
  console.log('Total users found:', users.length);
  
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`);
    console.log('  Email:', user.email);
    console.log('  Email type:', typeof user.email);
    console.log('  Email length:', user.email?.length);
    console.log('  Email normalized:', user.email?.trim().toLowerCase());
    console.log('  Name:', user.name);
    console.log('  Has password:', !!user.password);
    console.log('  Password length:', user.password?.length);
    console.log('  Role:', user.role);
  });
  
  // Test search
  const testEmail = 'test@ptpro.com';
  console.log('\n=== Testing search for:', testEmail, '===');
  const normalized = testEmail.trim().toLowerCase();
  
  const exactMatch = await User.findOne({ email: testEmail });
  console.log('Exact match:', exactMatch ? 'FOUND' : 'NOT FOUND');
  
  const normalizedMatch = await User.findOne({ email: normalized });
  console.log('Normalized match:', normalizedMatch ? 'FOUND' : 'NOT FOUND');
  
  const caseInsensitive = await User.findOne({ email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  console.log('Case-insensitive match:', caseInsensitive ? 'FOUND' : 'NOT FOUND');
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

