module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './src/config/global-setup.ts',
  globalTeardown: './src/config/global-teardown.ts',
  setupFiles: ['dotenv/config'], // Keep for loading .env for other purposes if any
  setupFilesAfterEnv: ['./src/config/test-setup.ts'], // For per-file setup like db authentication
  moduleNameMapper: {
    '^../models/index\\.js$': '<rootDir>/src/models/index.ts', // Force .js to resolve to .ts
    '^../models$': '<rootDir>/src/models/index.ts',
    '^../models/(.*)$': '<rootDir>/src/models/$1',
  },
  modulePathIgnorePatterns: [
    // This might not be effective enough if resolution still picks up the empty .js file first.
    // The moduleNameMapper above is a more direct attempt to control resolution.
    // '<rootDir>/src/models/index.js'
  ]
};