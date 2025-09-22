module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/nodes', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'nodes/**/*.ts',
    '!nodes/**/*.d.ts',
    '!nodes/**/demo.ts',
    '!nodes/**/test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000,
  verbose: true,
};
