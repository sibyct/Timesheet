import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@config/(.*)$':      '<rootDir>/config/$1',
    '^@modules/(.*)$':     '<rootDir>/modules/$1',
    '^@models/(.*)$':      '<rootDir>/models/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@utils/(.*)$':       '<rootDir>/utils/$1',
    '^@routes/(.*)$':      '<rootDir>/routes/$1',
  },
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/index.ts',
    '!server.ts',
  ],
  setupFilesAfterFramework: [],
  verbose: true,
};

export default config;
