/**
 * Jest Setup File
 * Extends Jest with custom matchers for API testing
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expectedValues: any): R;
      toMatchApiErrorFormat(): R;
      toHaveValidPagination(): R;
    }
  }
}

// Custom matcher for checking if value is one of several options
expect.extend({
  toBeOneOf(received: any, expectedValues: any) {
    const pass = expectedValues.includes(received);
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be one of ${expectedValues}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expectedValues}`,
        pass: false,
      };
    }
  },

  // Custom matcher for API error response format
  toMatchApiErrorFormat(received: any) {
    const pass =
      typeof received === "object" &&
      received !== null &&
      "error" in received &&
      "status" in received &&
      typeof received.error === "string";

    if (pass) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to match API error format`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to match API error format (should have 'error' and 'status' properties)`,
        pass: false,
      };
    }
  },

  // Custom matcher for pagination response format
  toHaveValidPagination(received: any) {
    const pass =
      typeof received === "object" &&
      received !== null &&
      "pagination" in received &&
      typeof received.pagination === "object" &&
      "page" in received.pagination &&
      "limit" in received.pagination &&
      "total" in received.pagination &&
      "pages" in received.pagination;

    if (pass) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to have valid pagination`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to have valid pagination (should have pagination object with page, limit, total, pages)`,
        pass: false,
      };
    }
  },
});

export {};
