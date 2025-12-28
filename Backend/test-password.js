require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./data/users/users');
const bcrypt = require('bcrypt');
const config = require('./config');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  const user = await User.findOne({ email: 'test@ptpro.com' });
  if (!user) {
    console.log('User not found');
    await mongoose.connection.close();
    process.exit(1);
  }
  
  console.log('Found user:', user.email);
  console.log('Password hash:', user.password);
  console.log('Hash length:', user.password?.length);
  
  const testPassword = 'test123';
  console.log('\nTesting password:', testPassword);
  
  const match = await bcrypt.compare(testPassword, user.password);
  console.log('Password match:', match);
  
  if (!match) {
    console.log('\n❌ Password does not match!');
    console.log('This means the password in DB was hashed with a different password.');
    console.log('The user was created with password "test123" but the hash does not match.');
  } else {
    console.log('\n✅ Password matches!');
  }
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

