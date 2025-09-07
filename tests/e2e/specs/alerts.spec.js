// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Alerts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to alerts page', async ({ page }) => {
    await page.click('text=Alerts');
    await expect(page).toHaveURL('/alerts');
    await expect(page.locator('h1:has-text("Property Alerts")')).toBeVisible();
  });

  test('should display alerts overview stats', async ({ page }) => {
    await page.goto('/alerts');
    
    // Check for stats cards
    await expect(page.locator('text=Total Alerts')).toBeVisible();
    await expect(page.locator('text=Active')).toBeVisible();
    await expect(page.locator('text=High Priority')).toBeVisible();
    await expect(page.locator('text=Resolved')).toBeVisible();
  });

  test('should show empty state when no alerts exist', async ({ page }) => {
    await page.goto('/alerts');
    
    // Should show empty state
    await expect(page.locator('text=No alerts found')).toBeVisible();
    await expect(page.locator('text=Create Your First Alert')).toBeVisible();
  });

  test('should navigate to create alert page', async ({ page }) => {
    await page.goto('/alerts');
    await page.click('text=New Alert');
    
    await expect(page).toHaveURL('/alerts/create');
    await expect(page.locator('h1:has-text("Create New Alert")')).toBeVisible();
  });

  test('should create a new alert successfully', async ({ page }) => {
    await page.goto('/alerts/create');
    
    // Fill out the alert form
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Test Alert');
    
    // Select alert type
    await page.click('[data-testid="alert-type-select"]');
    await page.click('text=Power of Sale');
    
    // Select priority
    await page.click('[data-testid="priority-select"]');
    await page.click('text=High');
    
    // Fill location details
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'King Street West');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    await page.fill('input[placeholder="M5V 3A8"]', 'M5V 3A8');
    
    // Fill price range
    await page.fill('input[placeholder="500000"]', '500000');
    await page.fill('input[placeholder="1000000"]', '1000000');
    
    // Add description
    await page.fill('textarea[placeholder="Add any additional criteria or notes..."]', 'Looking for investment properties in downtown Toronto');
    
    // Submit the form
    await page.click('button:has-text("Create Alert")');
    
    // Should redirect to alerts list
    await expect(page).toHaveURL('/alerts');
    
    // Should show the new alert
    await expect(page.locator('text=Test Alert')).toBeVisible();
    await expect(page.locator('text=King Street West, Toronto, ON')).toBeVisible();
  });

  test('should validate required fields in alert form', async ({ page }) => {
    await page.goto('/alerts/create');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Alert")');
    
    // Should show validation errors
    await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible();
    await expect(page.locator('text=Address must be at least 5 characters')).toBeVisible();
    await expect(page.locator('text=City must be at least 2 characters')).toBeVisible();
    await expect(page.locator('text=Province must be at least 2 characters')).toBeVisible();
  });

  test('should validate price range in alert form', async ({ page }) => {
    await page.goto('/alerts/create');
    
    // Fill required fields
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Test Alert');
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'King Street West');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    
    // Set invalid price range (max < min)
    await page.fill('input[placeholder="500000"]', '1000000');
    await page.fill('input[placeholder="1000000"]', '500000');
    
    await page.click('button:has-text("Create Alert")');
    
    // Should show validation error
    await expect(page.locator('text=Maximum price must be greater than minimum price')).toBeVisible();
  });

  test('should filter alerts by status', async ({ page }) => {
    await page.goto('/alerts');
    
    // Click on different filter tabs
    await page.click('text=Active');
    await expect(page.locator('[data-testid="active-filter"]')).toHaveClass(/border-indigo-500/);
    
    await page.click('text=High Priority');
    await expect(page.locator('[data-testid="high-priority-filter"]')).toHaveClass(/border-indigo-500/);
    
    await page.click('text=Resolved');
    await expect(page.locator('[data-testid="resolved-filter"]')).toHaveClass(/border-indigo-500/);
  });

  test('should search alerts', async ({ page }) => {
    await page.goto('/alerts');
    
    // Search for alerts
    await page.fill('input[placeholder="Search alerts..."]', 'Toronto');
    
    // Results should be filtered (assuming there are alerts with Toronto)
    // This would depend on having test data
  });

  test('should view alert details', async ({ page }) => {
    // First create an alert
    await page.goto('/alerts/create');
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Detailed Alert');
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'Bay Street');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    await page.click('button:has-text("Create Alert")');
    
    // Click on the alert to view details
    await page.click('text=Detailed Alert');
    
    // Should navigate to detail page
    await expect(page.locator('text=Alert Details')).toBeVisible();
    await expect(page.locator('text=Detailed Alert')).toBeVisible();
    await expect(page.locator('text=Bay Street, Toronto, ON')).toBeVisible();
  });

  test('should resolve an alert', async ({ page }) => {
    // Create an alert first
    await page.goto('/alerts/create');
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Alert to Resolve');
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'Main Street');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    await page.click('button:has-text("Create Alert")');
    
    // Go to alert details
    await page.click('text=Alert to Resolve');
    
    // Click resolve button
    await page.click('button:has-text("Resolve")');
    
    // Alert should be marked as resolved
    await expect(page.locator('text=RESOLVED')).toBeVisible();
  });

  test('should delete an alert', async ({ page }) => {
    // Create an alert first
    await page.goto('/alerts/create');
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Alert to Delete');
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'Delete Street');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    await page.click('button:has-text("Create Alert")');
    
    // Go to alert details
    await page.click('text=Alert to Delete');
    
    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click delete button
    await page.click('button:has-text("Delete")');
    
    // Should redirect back to alerts list
    await expect(page).toHaveURL('/alerts');
    
    // Alert should no longer be visible
    await expect(page.locator('text=Alert to Delete')).not.toBeVisible();
  });

  test('should show alert preview in create form', async ({ page }) => {
    await page.goto('/alerts/create');
    
    // Fill form fields and check preview updates
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Preview Test Alert');
    
    // Check if preview card shows the title
    await expect(page.locator('[data-testid="alert-preview"]')).toContainText('Preview Test Alert');
    
    // Select priority and check preview
    await page.click('[data-testid="priority-select"]');
    await page.click('text=High');
    
    await expect(page.locator('[data-testid="alert-preview"]')).toContainText('HIGH');
  });

  test('should cancel alert creation', async ({ page }) => {
    await page.goto('/alerts/create');
    
    // Fill some form data
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Cancelled Alert');
    
    // Click cancel
    await page.click('text=Cancel');
    
    // Should redirect to alerts list
    await expect(page).toHaveURL('/alerts');
    
    // Alert should not be created
    await expect(page.locator('text=Cancelled Alert')).not.toBeVisible();
  });

  test('should handle form submission errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/alerts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Server error' })
      });
    });
    
    await page.goto('/alerts/create');
    
    // Fill valid form data
    await page.fill('input[placeholder="e.g., Downtown Toronto Power of Sales"]', 'Error Test Alert');
    await page.fill('input[placeholder="e.g., King Street West, Toronto"]', 'Error Street');
    await page.fill('input[placeholder="Toronto"]', 'Toronto');
    await page.fill('input[placeholder="ON"]', 'ON');
    
    // Submit form
    await page.click('button:has-text("Create Alert")');
    
    // Should show error message
    await expect(page.locator('text=Server error')).toBeVisible();
  });
});