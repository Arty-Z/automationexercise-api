import { test, expect, APIRequestContext } from '@playwright/test';
import { BrandsListResponse } from '../schemas/apiSchemas';

/**
 * Brands List API Test Suite
 * 
 * Simple example test for GET /api/brandsList endpoint.
 * Returns all available product brands.
 */

test.describe('Brands List API - GET /api/brandsList', () => {
  
  let request: APIRequestContext;
  const endpoint = '/api/brandsList';

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://automationexercise.com',
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test('should return 200 status code for brands list', async () => {
    // Arrange
    const startTime = Date.now();

    // Act
    const response = await request.get(endpoint);
    const responseTime = Date.now() - startTime;

    // Assert
    expect(response.status()).toBe(200);
    expect.soft(responseTime).toBeLessThan(2000);
    
    console.log(`✓ Response time: ${responseTime}ms`);
  });

  test('should return valid brands list structure', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: BrandsListResponse = await response.json();

    // Assert
    expect(responseBody).toHaveProperty('responseCode');
    expect(responseBody).toHaveProperty('brands');
    expect(responseBody.responseCode).toBe(200);
    expect(Array.isArray(responseBody.brands)).toBe(true);
    expect(responseBody.brands.length).toBeGreaterThan(0);
    
    console.log(`✓ Total brands returned: ${responseBody.brands.length}`);
  });

  test('should return brands with required fields', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: BrandsListResponse = await response.json();

    // Assert
    const firstBrand = responseBody.brands[0];
    
    expect(firstBrand).toHaveProperty('id');
    expect(firstBrand).toHaveProperty('brand');
    expect(typeof firstBrand.id).toBe('number');
    expect(typeof firstBrand.brand).toBe('string');
    expect(firstBrand.brand.length).toBeGreaterThan(0);
    
    console.log(`✓ Sample brand: ID=${firstBrand.id}, Name="${firstBrand.brand}"`);
  });

  test('should return unique brand IDs', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: BrandsListResponse = await response.json();

    // Assert
    const brandIds = responseBody.brands.map(b => b.id);
    const uniqueIds = new Set(brandIds);
    
    expect(uniqueIds.size).toBe(brandIds.length);
    
    console.log(`✓ All ${brandIds.length} brand IDs are unique`);
  });

  test('should have non-empty brand names', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: BrandsListResponse = await response.json();

    // Assert
    const allBrandsHaveNames = responseBody.brands.every(brand => 
      brand.brand && brand.brand.trim().length > 0
    );
    
    expect(allBrandsHaveNames).toBe(true);
    
    console.log(`✓ All brands have valid names`);
    console.log(`✓ Sample brands: ${responseBody.brands.slice(0, 3).map(b => b.brand).join(', ')}`);
  });
});
