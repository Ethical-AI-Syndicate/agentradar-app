// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database state before each test
    await page.goto('/');
  });

  test('should display landing page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for key elements
    await expect(page.locator('text=AgentRadar')).toBeVisible();
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign in');
    
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2:has-text("Welcome Back")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Account');
    
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h2:has-text("Join AgentRadar")')).toBeVisible();
    await expect(page.locator('input[placeholder="John"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Doe"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors on empty registration form', async ({ page }) => {
    await page.goto('/register');
    await page.click('button:has-text("Create Account")');
    
    await expect(page.locator('text=First name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Last name must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Fill out registration form
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Your brokerage or company"]', 'Test Realty');
    await page.fill('input[type="tel"]', '+1 (555) 123-4567');
    await page.fill('input[placeholder="Create a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to dashboard on successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back, Test!')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user (assume this creates the user)
    await page.goto('/register');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[type="email"]', 'login@example.com');
    await page.fill('input[placeholder="Create a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    // Logout
    await page.click('[data-testid="logout-button"]');
    
    // Now test login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'login@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back, Test!')).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login a user
    await page.goto('/register');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[type="email"]', 'logout@example.com');
    await page.fill('input[placeholder="Create a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'TestPassword123!');
    await page.click('button:has-text("Create Account")');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2:has-text("Welcome Back")')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button:has([data-testid="eye-icon"])');
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await toggleButton.click();
    
    // Should become text type
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    
    // Should be password type again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should validate password requirements on registration', async ({ page }) => {
    await page.goto('/register');
    
    // Test weak password
    await page.fill('input[placeholder="Create a strong password"]', 'weak');
    await page.fill('input[placeholder="Confirm your password"]', 'weak');
    await page.click('button:has-text("Create Account")');
    
    await expect(page.locator('text=Password must contain at least one lowercase letter, one uppercase letter, and one number')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[placeholder="Create a strong password"]', 'TestPassword123!');
    await page.fill('input[placeholder="Confirm your password"]', 'DifferentPassword123!');
    await page.click('button:has-text("Create Account")');
    
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock a network failure
    await page.route('**/auth/login', route => {
      route.abort('failed');
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text=An unexpected error occurred')).toBeVisible();
  });
});