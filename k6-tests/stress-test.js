import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * k6 Stress Test - Prime Day / Cyber Monday Scenario
 * 
 * Scenario:
 * - Start at 100 virtual users (comfortable zone - last year's peak)
 * - Ramp up to 200 virtual users (expected peak this year)
 * - Hold 200 users for 3 minutes (sustained stress)
 * - Ramp down gracefully
 * 
 * Acceptance Criteria:
 * - Response times must stay under 3 seconds for 95% of requests
 * - Error rate must stay below 1%
 * 
 * Purpose: Identify which layer fails first (DB, API server, memory, etc.)
 */

// Custom metrics
const productsListDuration = new Trend('products_list_duration', true);
const searchProductDuration = new Trend('search_product_duration', true);
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to comfortable zone (last year's peak)
    { duration: '3m', target: 200 },  // Ramp up to expected peak (200+ users)
    { duration: '3m', target: 200 },  // Hold at peak for 3 minutes (sustained stress)
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  
  thresholds: {
    // 95% of all requests must complete below 3000ms
    'http_req_duration': ['p(95)<3000'],
    
    // 95% of products list requests must complete below 3000ms
    'http_req_duration{api_type:products_list}': ['p(95)<3000'],
    
    // 95% of search product requests must complete below 3000ms
    'http_req_duration{api_type:search_product}': ['p(95)<3000'],
    
    // Error rate must be below 1%
    'http_req_failed': ['rate<0.01'],
    
    // Custom error tracking
    'errors': ['rate<0.01'],
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
  
  const productsCheck = check(productsResponse, {
    'Products List: status is 200': (r) => r.status === 200,
    'Products List: response time < 3000ms': (r) => r.timings.duration < 3000,
    'Products List: has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.responseCode === 200 && body.products && body.products.length > 0;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!productsCheck);
  
  // Short pause between requests (simulating user think time)
  sleep(random(5, 15));

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

  const searchCheck = check(searchResponse, {
    'Search Product: status is 200': (r) => r.status === 200,
    'Search Product: response time < 3000ms': (r) => r.timings.duration < 3000,
    'Search Product: has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.responseCode === 200 && Array.isArray(body.products);
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!searchCheck);

  // Simulate realistic user behavior - think time between actions
  sleep(1);
}

/**
 * Setup function - runs once at the beginning
 */
export function setup() {
  console.log('🚀 Starting Prime Day / Cyber Monday Stress Test');
  console.log('📊 Target: 100 → 200 VUs, Hold for 3 minutes');
  console.log('🎯 Acceptance: p95 < 3s, Error rate < 1%');
  console.log('🔍 Monitoring: Response times, error rates, API performance');
  console.log('');
  console.log('⚠️  Note: For full observability, integrate with APM tools to monitor:');
  console.log('   - Database query performance and connection pool');
  console.log('   - API server CPU and memory usage');
  console.log('   - Network latency and bandwidth');
  console.log('   - Cache hit/miss rates');
  console.log('');
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  console.log('');
  console.log('✅ Stress test completed');
  console.log('📈 Check summary above for detailed metrics');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('   1. Review p95 response times - did they stay under 3s?');
  console.log('   2. Check error rate - was it below 1%?');
  console.log('   3. Analyze which API (products_list vs search_product) struggled first');
  console.log('   4. Review server logs for errors, memory leaks, or slow queries');
  console.log('   5. Monitor database connection pool and query performance');
  console.log('   6. Check if horizontal scaling is needed');
  console.log('');
}

/**
 * Custom summary handler
 */
export function handleSummary(data) {
  console.log('');
  console.log('========================================');
  console.log('  PRIME DAY STRESS TEST - RESULTS');
  console.log('========================================');
  console.log('');
  console.log('Test Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  console.log(`  Peak VUs: 200`);
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
  console.log(`  p95: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms (Threshold: <3000ms)`);
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
  
  if (p95 < 3000 && errorRateValue < 0.01) {
    console.log('  ✅ PASSED - System can handle 200+ concurrent users');
    console.log('  ✅ Response times within acceptable range (p95 < 3s)');
    console.log('  ✅ Error rate within acceptable range (<1%)');
  } else {
    console.log('  ❌ FAILED - System needs optimization');
    if (p95 >= 3000) {
      console.log(`  ❌ Response times too high: p95=${p95.toFixed(2)}ms (threshold: 3000ms)`);
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
