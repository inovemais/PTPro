require('dotenv').config();
const mongoose = require('mongoose');

// Use a test database
const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ptpro-test';

// Connect to test database before all tests
beforeAll(async () => {
  try {
    await mongoose.connect(TEST_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Test database connection error:', error);
  }
});

// Clear database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

