require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./data/users/users');
const config = require('./config');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;

mongoose.connect(mongoUri).then(async () => {
  const users = await User.find({}).limit(10).select('email name password role');
  
  users.forEach((user, index) => {
  });
  
  // Test search
  const testEmail = 'test@ptpro.com';
  const normalized = testEmail.trim().toLowerCase();
  
  const exactMatch = await User.findOne({ email: testEmail });
  const normalizedMatch = await User.findOne({ email: normalized });
  const caseInsensitive = await User.findOne({ email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

