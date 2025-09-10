/**
 * Custom Jest Matchers for AgentRadar API Testing
 *
 * Provides domain-specific matchers for more readable and maintainable tests
 */

import { expect } from "@jest/globals";

// Extend Jest matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJWT(): R;
      toBeValidEmail(): R;
      toBeValidPhoneNumber(): R;
      toMatchUserSchema(): R;
      toMatchAlertSchema(): R;
      toHaveValidPagination(): R;
      toBeWithinTimeRange(start: Date, end: Date): R;
      toHaveValidCoordinates(): R;
      toBeValidMonetaryAmount(): R;
      toMatchApiErrorFormat(): R;
      toHaveSecureHeaders(): R;
      toBeValidSubscriptionTier(): R;
      toBeOneOf(expectedValues: any): R;
    }
  }
}

// JWT validation matcher
expect.extend({
  toBeValidJWT(received: string) {
    if (typeof received !== "string") {
      return {
        pass: false,
        message: () => `Expected a string, but received ${typeof received}`,
      };
    }

    // JWT format: header.payload.signature
    const jwtParts = received.split(".");
    if (jwtParts.length !== 3) {
      return {
        pass: false,
        message: () =>
          `Expected JWT with 3 parts, but received ${jwtParts.length} parts`,
      };
    }

    // Basic base64 validation for each part
    try {
      jwtParts.forEach((part) => {
        if (!part || part.length === 0) {
          throw new Error("Empty JWT part");
        }
        // Attempt to decode base64 (JWT uses base64url, but this is basic validation)
        Buffer.from(part, "base64");
      });
    } catch (error) {
      return {
        pass: false,
        message: () =>
          `Invalid JWT format: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    return {
      pass: true,
      message: () => `Expected ${received} not to be a valid JWT`,
    };
  },
});

// Email validation matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = typeof received === "string" && emailRegex.test(received);

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
    };
  },
});

// Phone number validation matcher
expect.extend({
  toBeValidPhoneNumber(received: string) {
    // Basic phone number validation (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const isValid = typeof received === "string" && phoneRegex.test(received);

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected ${received} not to be a valid phone number`
          : `Expected ${received} to be a valid phone number (international format)`,
    };
  },
});

// User schema validation matcher
expect.extend({
  toMatchUserSchema(received: any) {
    const requiredFields = [
      "id",
      "email",
      "firstName",
      "lastName",
      "subscriptionTier",
    ];
    const forbiddenFields = ["password"];

    if (typeof received !== "object" || received === null) {
      return {
        pass: false,
        message: () => `Expected an object, but received ${typeof received}`,
      };
    }

    // Check required fields
    const missingFields = requiredFields.filter(
      (field) => !(field in received),
    );
    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Check forbidden fields
    const presentForbiddenFields = forbiddenFields.filter(
      (field) => field in received,
    );
    if (presentForbiddenFields.length > 0) {
      return {
        pass: false,
        message: () =>
          `Contains forbidden fields: ${presentForbiddenFields.join(", ")}`,
      };
    }

    // Validate email format
    if (
      !received.email ||
      typeof received.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email)
    ) {
      return {
        pass: false,
        message: () => `Invalid email format: ${received.email}`,
      };
    }

    // Validate subscription tier
    const validTiers = [
      "FREE",
      "SOLO_AGENT",
      "PROFESSIONAL",
      "TEAM_ENTERPRISE",
      "WHITE_LABEL",
    ];
    if (!validTiers.includes(received.subscriptionTier)) {
      return {
        pass: false,
        message: () =>
          `Invalid subscription tier: ${received.subscriptionTier}`,
      };
    }

    return {
      pass: true,
      message: () => `Expected object not to match user schema`,
    };
  },
});

// Alert schema validation matcher
expect.extend({
  toMatchAlertSchema(received: any) {
    const requiredFields = [
      "id",
      "title",
      "description",
      "address",
      "city",
      "province",
      "alertType",
      "status",
      "priority",
      "opportunityScore",
    ];

    if (typeof received !== "object" || received === null) {
      return {
        pass: false,
        message: () => `Expected an object, but received ${typeof received}`,
      };
    }

    // Check required fields
    const missingFields = requiredFields.filter(
      (field) => !(field in received),
    );
    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Missing required fields: ${missingFields.join(", ")}`,
      };
    }

    // Validate alert type
    const validAlertTypes = [
      "POWER_OF_SALE",
      "ESTATE_SALE",
      "DEVELOPMENT_APPLICATION",
      "MUNICIPAL_PERMIT",
      "PROBATE_FILING",
      "TAX_SALE",
    ];
    if (!validAlertTypes.includes(received.alertType)) {
      return {
        pass: false,
        message: () => `Invalid alert type: ${received.alertType}`,
      };
    }

    // Validate priority
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (!validPriorities.includes(received.priority)) {
      return {
        pass: false,
        message: () => `Invalid priority: ${received.priority}`,
      };
    }

    // Validate opportunity score
    if (
      typeof received.opportunityScore !== "number" ||
      received.opportunityScore < 0 ||
      received.opportunityScore > 100
    ) {
      return {
        pass: false,
        message: () =>
          `Invalid opportunity score: ${received.opportunityScore} (must be 0-100)`,
      };
    }

    return {
      pass: true,
      message: () => `Expected object not to match alert schema`,
    };
  },
});

// Pagination validation matcher
expect.extend({
  toHaveValidPagination(received: any) {
    if (typeof received !== "object" || received === null) {
      return {
        pass: false,
        message: () => `Expected an object, but received ${typeof received}`,
      };
    }

    const requiredFields = ["data", "pagination"];
    const missingFields = requiredFields.filter(
      (field) => !(field in received),
    );
    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `Missing pagination fields: ${missingFields.join(", ")}`,
      };
    }

    const pagination = received.pagination;
    const paginationFields = ["page", "limit", "total", "totalPages"];
    const missingPaginationFields = paginationFields.filter(
      (field) => !(field in pagination),
    );
    if (missingPaginationFields.length > 0) {
      return {
        pass: false,
        message: () =>
          `Missing pagination fields: ${missingPaginationFields.join(", ")}`,
      };
    }

    // Validate pagination values
    if (!Number.isInteger(pagination.page) || pagination.page < 1) {
      return {
        pass: false,
        message: () => `Invalid page number: ${pagination.page}`,
      };
    }

    if (!Number.isInteger(pagination.limit) || pagination.limit < 1) {
      return {
        pass: false,
        message: () => `Invalid limit: ${pagination.limit}`,
      };
    }

    if (!Number.isInteger(pagination.total) || pagination.total < 0) {
      return {
        pass: false,
        message: () => `Invalid total: ${pagination.total}`,
      };
    }

    if (!Array.isArray(received.data)) {
      return {
        pass: false,
        message: () => `Data should be an array`,
      };
    }

    return {
      pass: true,
      message: () => `Expected object not to have valid pagination`,
    };
  },
});

// Time range validation matcher
expect.extend({
  toBeWithinTimeRange(received: string | Date, start: Date, end: Date) {
    let receivedDate: Date;

    try {
      receivedDate = new Date(received);
      if (isNaN(receivedDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch {
      return {
        pass: false,
        message: () => `Expected a valid date, but received ${received}`,
      };
    }

    const isWithinRange = receivedDate >= start && receivedDate <= end;

    return {
      pass: isWithinRange,
      message: () =>
        isWithinRange
          ? `Expected ${receivedDate.toISOString()} not to be within range ${start.toISOString()} - ${end.toISOString()}`
          : `Expected ${receivedDate.toISOString()} to be within range ${start.toISOString()} - ${end.toISOString()}`,
    };
  },
});

// Coordinate validation matcher
expect.extend({
  toHaveValidCoordinates(received: any) {
    if (typeof received !== "object" || received === null) {
      return {
        pass: false,
        message: () => `Expected an object, but received ${typeof received}`,
      };
    }

    const { latitude, longitude } = received;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return {
        pass: false,
        message: () =>
          `Coordinates must be numbers. Received lat: ${typeof latitude}, lng: ${typeof longitude}`,
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        pass: false,
        message: () =>
          `Invalid latitude: ${latitude} (must be between -90 and 90)`,
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        pass: false,
        message: () =>
          `Invalid longitude: ${longitude} (must be between -180 and 180)`,
      };
    }

    return {
      pass: true,
      message: () => `Expected coordinates not to be valid`,
    };
  },
});

// Monetary amount validation matcher
expect.extend({
  toBeValidMonetaryAmount(received: any) {
    if (typeof received !== "number") {
      return {
        pass: false,
        message: () => `Expected a number, but received ${typeof received}`,
      };
    }

    if (received < 0) {
      return {
        pass: false,
        message: () => `Monetary amount cannot be negative: ${received}`,
      };
    }

    if (!Number.isInteger(received)) {
      return {
        pass: false,
        message: () =>
          `Monetary amount should be in cents (integer): ${received}`,
      };
    }

    return {
      pass: true,
      message: () => `Expected ${received} not to be a valid monetary amount`,
    };
  },
});

// API error format validation matcher
expect.extend({
  toMatchApiErrorFormat(received: any) {
    if (typeof received !== "object" || received === null) {
      return {
        pass: false,
        message: () => `Expected an object, but received ${typeof received}`,
      };
    }

    const requiredFields = ["error"];
    const optionalFields = ["details", "code", "timestamp"];

    const missingRequired = requiredFields.filter(
      (field) => !(field in received),
    );
    if (missingRequired.length > 0) {
      return {
        pass: false,
        message: () =>
          `Missing required error fields: ${missingRequired.join(", ")}`,
      };
    }

    if (typeof received.error !== "string" || received.error.length === 0) {
      return {
        pass: false,
        message: () => `Error message must be a non-empty string`,
      };
    }

    return {
      pass: true,
      message: () => `Expected object not to match API error format`,
    };
  },
});

// Security headers validation matcher
expect.extend({
  toHaveSecureHeaders(received: any) {
    if (!received || typeof received.get !== "function") {
      return {
        pass: false,
        message: () => `Expected response object with headers`,
      };
    }

    const requiredHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
    ];

    const missingHeaders = requiredHeaders.filter(
      (header) => !received.get(header),
    );
    if (missingHeaders.length > 0) {
      return {
        pass: false,
        message: () => `Missing security headers: ${missingHeaders.join(", ")}`,
      };
    }

    return {
      pass: true,
      message: () => `Expected response not to have secure headers`,
    };
  },
});

// Subscription tier validation matcher
expect.extend({
  toBeValidSubscriptionTier(received: string) {
    const validTiers = [
      "FREE",
      "SOLO_AGENT",
      "PROFESSIONAL",
      "TEAM_ENTERPRISE",
      "WHITE_LABEL",
    ];
    const isValid = validTiers.includes(received);

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected ${received} not to be a valid subscription tier`
          : `Expected ${received} to be a valid subscription tier. Valid options: ${validTiers.join(", ")}`,
    };
  },

  // One of values validation matcher
  toBeOneOf(received: any, expectedValues: any) {
    const pass = expectedValues.includes(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be one of ${expectedValues}`
          : `expected ${received} to be one of ${expectedValues}`,
      pass,
    };
  },
});
