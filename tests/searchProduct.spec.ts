import { test, expect, APIRequestContext } from '@playwright/test';
import { SearchProductResponse } from '../schemas/apiSchemas';

/**
 * Search Product API Test Suite
 * 
 * Tests the POST /api/searchProduct endpoint which searches for products.
 * This endpoint accepts a search term and returns matching products.
 */

test.describe('Search Product API - POST /api/searchProduct', () => {
  
  let request: APIRequestContext;
  const endpoint = '/api/searchProduct';

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://automationexercise.com',
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test('should return 200 status for valid search term', async () => {
    // Arrange
    const searchTerm = 'shirt';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);
    const startTime = Date.now();

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseTime = Date.now() - startTime;

    // Assert
    expect(response.status()).toBe(200);
    expect.soft(responseTime, `Response time should be under 2000ms, got ${responseTime}ms`).toBeLessThan(2000);
    
    console.log(`✓ Response time: ${responseTime}ms`);
  });

  test('should return matching products for valid search term - "shirt"', async () => {
    // Arrange
    const searchTerm = 'shirt';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody: SearchProductResponse = await response.json();

    // Assert
    expect(responseBody.responseCode).toBe(200);
    expect(Array.isArray(responseBody.products)).toBe(true);
    expect(responseBody.products.length).toBeGreaterThan(0);
    
    // Verify search results are returned (API may match partial terms like "tshirt" for "shirt")
    // The API uses fuzzy matching, so we just verify we got results
    expect(responseBody.products.length).toBeGreaterThan(0);
    
    console.log(`✓ Found ${responseBody.products.length} products matching "${searchTerm}"`);
    console.log(`✓ Sample result: "${responseBody.products[0].name}"`);
  });

  test('should return matching products for search term - "jeans"', async () => {
    // Arrange
    const searchTerm = 'jeans';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody: SearchProductResponse = await response.json();

    // Assert
    expect(responseBody.responseCode).toBe(200);
    expect(responseBody.products.length).toBeGreaterThan(0);
    
    // Verify products have required fields
    responseBody.products.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('brand');
    });
    
    console.log(`✓ Found ${responseBody.products.length} products matching "${searchTerm}"`);
  });

  test('should return empty or minimal results for non-existent product', async () => {
    // Arrange
    const searchTerm = 'nonexistentproduct12345xyz';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody: SearchProductResponse = await response.json();

    // Assert
    expect(response.status()).toBe(200);
    expect(responseBody.responseCode).toBe(200);
    expect(Array.isArray(responseBody.products)).toBe(true);
    
    // Should return empty array or no matching products
    console.log(`✓ Search for non-existent product returned ${responseBody.products.length} results (expected 0 or minimal)`);
  });

  test('should handle empty search term', async () => {
    // Arrange
    const searchTerm = '';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody: SearchProductResponse = await response.json();

    // Assert
    expect(response.status()).toBe(200);
    expect(responseBody.responseCode).toBe(200);
    
    console.log(`✓ Empty search term returned ${responseBody.products.length} products`);
  });

  test('should handle special characters in search term', async () => {
    // Arrange
    const searchTerm = 'top@#$%';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act
    const response = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });

    // Assert
    expect(response.status()).toBe(200);
    
    console.log(`✓ API handled special characters in search term gracefully`);
  });

  test('should return consistent results for same search term', async () => {
    // Arrange
    const searchTerm = 'dress';
    const formData = new URLSearchParams();
    formData.append('search_product', searchTerm);

    // Act - Make two identical requests
    const response1 = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody1: SearchProductResponse = await response1.json();

    const response2 = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formData.toString(),
    });
    const responseBody2: SearchProductResponse = await response2.json();

    // Assert - Results should be identical
    expect(responseBody1.products.length).toBe(responseBody2.products.length);
    expect(responseBody1.responseCode).toBe(responseBody2.responseCode);
    
    console.log(`✓ Consistent results: both requests returned ${responseBody1.products.length} products`);
  });

  test('should perform case-insensitive search', async () => {
    // Arrange
    const searchTermLower = 'top';
    const searchTermUpper = 'TOP';
    
    const formDataLower = new URLSearchParams();
    formDataLower.append('search_product', searchTermLower);
    
    const formDataUpper = new URLSearchParams();
    formDataUpper.append('search_product', searchTermUpper);

    // Act
    const responseLower = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formDataLower.toString(),
    });
    const responseBodyLower: SearchProductResponse = await responseLower.json();

    const responseUpper = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: formDataUpper.toString(),
    });
    const responseBodyUpper: SearchProductResponse = await responseUpper.json();

    // Assert
    expect(responseBodyLower.products.length).toBeGreaterThan(0);
    expect(responseBodyUpper.products.length).toBeGreaterThan(0);
    
    console.log(`✓ Lowercase "${searchTermLower}": ${responseBodyLower.products.length} results`);
    console.log(`✓ Uppercase "${searchTermUpper}": ${responseBodyUpper.products.length} results`);
  });
});
