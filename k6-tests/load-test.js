import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

/**
 * k6 Load Test - Regular Performance Validation
 * 
 * Scenario:
 * - Test system performance under expected normal and peak production loads
 * - Gradual ramp-up to average load, then to peak load
 * - Sustained period at peak to validate stability
 * - Graceful ramp-down
 * 
 * Acceptance Criteria:
 * - Response times must stay under 2 seconds for 95% of requests
 * - Error rate must stay below 1%
 * 
 * Purpose: Weekly validation of system performance under normal operating conditions
 */

// Custom metrics
const productsListDuration = new Trend('products_list_duration', true);
const searchProductDuration = new Trend('search_product_duration', true);

export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp up to average load
    { duration: '10m', target: 100 }, // Ramp up to peak load
    { duration: '10m', target: 100 }, // Stay at peak
    { duration: '5m', target: 0 },    // Ramp down
  ],
  
  thresholds: {
    // 95% of all requests must complete below 2000ms
    'http_req_duration': ['p(95)<2000'],
    
    // 95% of products list requests must complete below 2000ms
    'http_req_duration{api_type:products_list}': ['p(95)<2000'],
    
    // 95% of search product requests must complete below 2000ms
    'http_req_duration{api_type:search_product}': ['p(95)<2000'],
    
    // Error rate must be below 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://automationexercise.com';

// Sample search terms for variety
const searchTerms = ['shirt', 'jeans', 'dress', 'top', 'tshirt', 'pants'];

export default function () {
  // Test 1: GET Products List API
  const productsListStart = Date.now();
  const productsResponse = http.get(`${BASE_URL}/api/productsList`, {
    tags: { api_type: 'products_list' },
  });
  const productsListEnd = Date.now();
  productsListDuration.add(productsListEnd - productsListStart);
  
  check(productsResponse, {
    'Products List: status is 200': (r) => r.status === 200,
    'Products List: response time < 2000ms': (r) => r.timings.duration < 2000,
    'Products List: has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.responseCode === 200 && body.products && body.products.length > 0;
      } catch (e) {
        return false;
      }
    },
  });
  
  // Short pause between requests (simulating user think time)
  sleep(0.5);

  // Test 2: POST Search Product API
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const searchPayload = `search_product=${searchTerm}`;
  
  const searchProductStart = Date.now();
  const searchResponse = http.post(
    `${BASE_URL}/api/searchProduct`,
    searchPayload,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      tags: { api_type: 'search_product' },
    }
  );
  const searchProductEnd = Date.now();
  searchProductDuration.add(searchProductEnd - searchProductStart);

  check(searchResponse, {
    'Search Product: status is 200': (r) => r.status === 200,
    'Search Product: response time < 2000ms': (r) => r.timings.duration < 2000,
    'Search Product: has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.responseCode === 200 && Array.isArray(body.products);
      } catch (e) {
        return false;
      }
    },
  });

  // Simulate realistic user behavior - think time between actions
  sleep(1);
}

/**
 * Setup function - runs once at the beginning
 */
export function setup() {
  console.log('📊 Starting Load Test - Normal Performance Validation');
  console.log('🎯 Target: 50 → 100 VUs over 30 minutes');
  console.log('✅ Acceptance: p95 < 2s, Error rate < 1%');
  console.log('🔍 Monitoring: Response times, error rates, API performance');
  console.log('');
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  console.log('');
  console.log('✅ Load test completed');
  console.log('📈 Check summary above for detailed metrics');
  console.log('');
}

/**
 * Custom summary handler
 */
export function handleSummary(data) {
  console.log('');
  console.log('========================================');
  console.log('  LOAD TEST - RESULTS');
  console.log('========================================');
  console.log('');
  console.log('Test Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  console.log(`  Peak VUs: 100`);
  console.log('');
  console.log('Overall Metrics:');
  console.log(`  Total Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}`);
  console.log(`  Iterations: ${data.metrics.iterations.values.count}`);
  console.log(`  Failed Requests: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}% (Threshold: <1%)`);
  console.log('');
  console.log('Response Time Analysis:');
  console.log(`  Average: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0}ms`);
  console.log(`  Median (p50): ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 0}ms`);
  console.log(`  p90: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(90)'].toFixed(2) : 0}ms`);
  console.log(`  p95: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms (Threshold: <2000ms)`);
  console.log(`  p99: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'].toFixed(2) : 0}ms`);
  console.log(`  Max: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max.toFixed(2) : 0}ms`);
  console.log('');
  console.log('API-Specific Performance:');
  console.log('  Products List API:');
  console.log(`    Avg Duration: ${data.metrics.products_list_duration ? data.metrics.products_list_duration.values.avg.toFixed(2) : 0}ms`);
  console.log(`    p95 Duration: ${data.metrics.products_list_duration ? data.metrics.products_list_duration.values['p(95)'].toFixed(2) : 0}ms`);
  console.log('  Search Product API:');
  console.log(`    Avg Duration: ${data.metrics.search_product_duration ? data.metrics.search_product_duration.values.avg.toFixed(2) : 0}ms`);
  console.log(`    p95 Duration: ${data.metrics.search_product_duration ? data.metrics.search_product_duration.values['p(95)'].toFixed(2) : 0}ms`);
  console.log('');
  console.log('Verdict:');
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0;
  const errorRateValue = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate : 0;
  
  if (p95 < 2000 && errorRateValue < 0.01) {
    console.log('  ✅ PASSED - System performing well under normal load');
    console.log('  ✅ Response times within acceptable range (p95 < 2s)');
    console.log('  ✅ Error rate within acceptable range (<1%)');
  } else {
    console.log('  ❌ FAILED - System needs optimization');
    if (p95 >= 2000) {
      console.log(`  ❌ Response times too high: p95=${p95.toFixed(2)}ms (threshold: 2000ms)`);
    }
    if (errorRateValue >= 0.01) {
      console.log(`  ❌ Error rate too high: ${(errorRateValue * 100).toFixed(2)}% (threshold: 1%)`);
    }
  }
  console.log('');
  console.log('========================================');
  console.log('');
  
  return {
    'stdout': '', // Summary already printed above
  };
}
