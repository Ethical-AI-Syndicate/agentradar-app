module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts",
    "!src/generated/**",
    "!src/seed.ts",
    "!src/index.ts",
    "!src/__tests__/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  // Coverage thresholds to enforce quality gates
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Per-directory thresholds for critical components
    "src/routes/": {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "src/services/": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "src/middleware/": {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
  },
  setupFilesAfterEnv: [
    "<rootDir>/src/__tests__/setup.ts",
    "<rootDir>/src/__tests__/matchers.ts",
    "<rootDir>/src/__tests__/setup/jest-setup.ts",
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  // Global test setup and teardown
  globalSetup: "<rootDir>/src/__tests__/setup/global-setup.ts",
  globalTeardown: "<rootDir>/src/__tests__/setup/global-teardown.ts",
  // Module name mapping for cleaner imports
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/src/__tests__/$1",
  },
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },
  // Collect coverage only when explicitly requested
  collectCoverage: process.env.COLLECT_COVERAGE === "true",
  // Performance monitoring
  maxWorkers: process.env.CI ? 2 : "50%",
  // Error handling
  bail: process.env.CI ? 1 : 0,
  // Test filtering
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "src/__tests__/fixtures/",
    "src/__tests__/helpers/",
    "src/__tests__/mocks/",
  ],
};
