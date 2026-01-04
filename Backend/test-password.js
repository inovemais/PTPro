require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./data/users/users');
const bcrypt = require('bcrypt');
const config = require('./config');

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || config.db;

mongoose.connect(mongoUri).then(async () => {
  const user = await User.findOne({ email: 'test@ptpro.com' });
  if (!user) {
    await mongoose.connection.close();
    process.exit(1);
  }
  
  const testPassword = 'test123';
  
  const match = await bcrypt.compare(testPassword, user.password);
  
  await mongoose.connection.close();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

