import { test, expect, APIRequestContext } from '@playwright/test';
import { ProductsListResponse } from '../schemas/apiSchemas';

/**
 * Products List API Test Suite
 * 
 * Tests the GET /api/productsList endpoint which returns all available products.
 * This is a critical endpoint for e-commerce functionality.
 */

test.describe('Products List API - GET /api/productsList', () => {
  
  let request: APIRequestContext;
  const endpoint = '/api/productsList';

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://automationexercise.com',
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test('should return 200 status code for products list', async () => {
    // Arrange
    const startTime = Date.now();

    // Act
    const response = await request.get(endpoint);
    const responseTime = Date.now() - startTime;

    // Assert
    expect(response.status()).toBe(200);
    
    // Soft assertion for response time (informational, won't fail the test)
    expect.soft(responseTime, `Response time should be under 2000ms, got ${responseTime}ms`).toBeLessThan(2000);
    
    console.log(`✓ Response time: ${responseTime}ms`);
  });

  test('should return valid JSON response structure', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: ProductsListResponse = await response.json();

    // Assert - Response structure
    expect(responseBody).toHaveProperty('responseCode');
    expect(responseBody).toHaveProperty('products');
    expect(responseBody.responseCode).toBe(200);
    
    // Assert - Products array
    expect(Array.isArray(responseBody.products)).toBe(true);
    expect(responseBody.products.length).toBeGreaterThan(0);
    
    console.log(`✓ Total products returned: ${responseBody.products.length}`);
  });

  test('should return products with required fields', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: ProductsListResponse = await response.json();

    // Assert - First product structure
    const firstProduct = responseBody.products[0];
    
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('brand');
    
    // Assert - Field types
    expect(typeof firstProduct.id).toBe('number');
    expect(typeof firstProduct.name).toBe('string');
    expect(typeof firstProduct.price).toBe('string');
    expect(typeof firstProduct.brand).toBe('string');
    
    console.log(`✓ Sample product: ID=${firstProduct.id}, Name="${firstProduct.name}", Price=${firstProduct.price}`);
  });

  test('should return products with valid category structure', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: ProductsListResponse = await response.json();

    // Assert - Category structure
    const productsWithCategory = responseBody.products.filter(p => p.category);
    
    expect(productsWithCategory.length).toBeGreaterThan(0);
    
    const productWithCategory = productsWithCategory[0];
    expect(productWithCategory.category).toHaveProperty('category');
    
    console.log(`✓ Products with category: ${productsWithCategory.length}/${responseBody.products.length}`);
  });

  test('should return unique product IDs', async () => {
    // Arrange & Act
    const response = await request.get(endpoint);
    const responseBody: ProductsListResponse = await response.json();

    // Assert - Unique IDs
    const productIds = responseBody.products.map(p => p.id);
    const uniqueIds = new Set(productIds);
    
    expect(uniqueIds.size).toBe(productIds.length);
    
    console.log(`✓ All ${productIds.length} product IDs are unique`);
  });

  test('should have consistent response time across multiple calls', async () => {
    // Arrange
    const iterations = 3;
    const responseTimes: number[] = [];

    // Act
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const response = await request.get(endpoint);
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      responseTimes.push(responseTime);
    }

    // Assert
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
    const maxResponseTime = Math.max(...responseTimes);
    
    expect.soft(avgResponseTime).toBeLessThan(2000);
    expect.soft(maxResponseTime).toBeLessThan(3000);
    
    console.log(`✓ Response times: ${responseTimes.join('ms, ')}ms`);
    console.log(`✓ Average: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime}ms`);
  });
});
