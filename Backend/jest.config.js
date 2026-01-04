module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/uploads/'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/uploads/**',
    '!jest.config.js',
    '!index.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

