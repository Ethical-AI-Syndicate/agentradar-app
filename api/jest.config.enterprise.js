/**
 * Enterprise Jest Configuration - Phase 5 QA Excellence
 * TARGET: 95%+ Code Coverage with Zero-Tolerance Quality Gates
 * STANDARDS: Fortune 100 Testing Excellence
 */

module.exports = {
  // Base configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  
  // Test discovery and patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}'
  ],
  
  // Module resolution for enterprise testing
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/__tests__/$1',
    '^@mocks/(.*)$': '<rootDir>/src/__tests__/mocks/$1',
    '^@fixtures/(.*)$': '<rootDir>/src/__tests__/fixtures/$1',
  },
  
  // Enterprise-grade coverage requirements
  collectCoverage: process.env.COLLECT_COVERAGE !== 'false',
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*',
    '!src/index.ts',
    '!src/types/**/*',
    '!src/generated/**/*',
    '!**/node_modules/**',
  ],
  
  // CRITICAL: Zero-tolerance coverage thresholds
  coverageThreshold: {
    global: {
      // Enterprise minimum standards
      lines: 95,
      functions: 90,
      branches: 90,
      statements: 95,
    },
    // Critical component requirements
    './src/routes/**/*.ts': {
      lines: 100,    // API routes must be 100% tested
      functions: 100,
      branches: 95,
      statements: 100,
    },
    './src/middleware/**/*.ts': {
      lines: 100,    // Security middleware 100% coverage
      functions: 100,
      branches: 100,
      statements: 100,
    },
    './src/services/**/*.ts': {
      lines: 95,     // Business logic high coverage
      functions: 95,
      branches: 90,
      statements: 95,
    },
    './src/utils/**/*.ts': {
      lines: 95,     // Utilities high coverage
      functions: 95,
      branches: 90,
      statements: 95,
    },
  },
  
  // Coverage reporting for enterprise compliance
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
    'cobertura', // For enterprise CI/CD integration
  ],
  coverageDirectory: '<rootDir>/coverage',
  
  // Setup and teardown for enterprise testing
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.ts',
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/jest-setup.ts',
    '<rootDir>/src/__tests__/setup/database-setup.ts',
    '<rootDir>/src/__tests__/setup/performance-setup.ts',
  ],
  
  // Enterprise performance and reliability
  testTimeout: 30000, // 30 second timeout for comprehensive tests
  maxWorkers: process.env.CI ? 2 : '50%', // Optimize for CI/local
  workerIdleMemoryLimit: '1GB',
  
  // Advanced testing features
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Transform and module handling
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      useESM: false,
    }],
  },
  
  // Mock handling for enterprise testing
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // Test categorization for enterprise workflows
  projects: [
    // Unit tests - fast feedback
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.{js,ts}'],
      testTimeout: 10000,
    },
    // Integration tests - API and database
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.{js,ts}'],
      testTimeout: 30000,
      globalSetup: '<rootDir>/src/__tests__/setup/integration-setup.ts',
    },
    // Security tests - comprehensive security validation
    {
      displayName: 'security',
      testMatch: ['<rootDir>/src/__tests__/security/**/*.test.{js,ts}'],
      testTimeout: 60000,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/security-setup.ts'],
    },
    // Performance tests - load and stress testing
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/__tests__/performance/**/*.test.{js,ts}'],
      testTimeout: 300000, // 5 minutes for performance tests
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/performance-setup.ts'],
    },
    // End-to-end tests - complete user journeys
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.{js,ts}'],
      testTimeout: 120000, // 2 minutes for E2E tests
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/e2e-setup.ts'],
    },
  ],
  
  // Enterprise reporting and monitoring
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        outputPath: '<rootDir>/test-results/test-report.html',
        pageTitle: 'AgentRadar Enterprise Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
      },
    ],
  ],
  
  // Error handling and debugging
  verbose: process.env.CI ? false : true,
  detectOpenHandles: true,
  detectLeaks: true,
  logHeapUsage: true,
  
  // Cache optimization for enterprise CI/CD
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Custom matchers for enterprise testing
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/custom-matchers.ts',
    '<rootDir>/src/__tests__/setup/enterprise-assertions.ts',
  ],
  
  // Environment variables for testing
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};