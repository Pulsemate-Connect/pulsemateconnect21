'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/services/**/*.js',
    'src/middleware/**/*.js',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: { lines: 30, functions: 17, branches: 13, statements: 30 },
  },
  // Socket integration test has its own mocks and must NOT run setup.js
  // All other tests use the Prisma mock setup
  projects: [
    {
      displayName: 'unit-and-integration',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/unit/**/*.test.js',
        '**/__tests__/integration/!(queue.socket)*.test.js',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
      clearMocks: true,
      restoreMocks: true,
    },
    {
      displayName: 'socket-integration',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/integration/queue.socket.integration.test.js'],
      setupFilesAfterEnv: [],
      clearMocks: true,
      restoreMocks: true,
    },
  ],
};
