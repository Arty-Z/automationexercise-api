import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright configuration for API testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'https://automationexercise.com',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* API testing specific settings */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  /* Global timeout for each test */
  timeout: 30000,

  /* Global timeout for assertions */
  expect: {
    timeout: 10000,
  },

  /* Configure projects for different test scenarios */
  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.spec.ts',
    },
  ],
});
