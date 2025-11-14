import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Demo Test
 * 
 * A simple demonstration of k6 load testing capabilities.
 * Tests basic API endpoints with minimal load.
 */

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s', // Run for 30 seconds
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'], // Error rate should be less than 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://automationexercise.com';

export default function () {
  // Test 1: GET Products List
  const productsResponse = http.get(`${BASE_URL}/api/productsList`);
  
  check(productsResponse, {
    'Products List: status is 200': (r) => r.status === 200,
    'Products List: response time < 2000ms': (r) => r.timings.duration < 2000,
    'Products List: has products': (r) => {
      const body = JSON.parse(r.body);
      return body.products && body.products.length > 0;
    },
  });

  sleep(1);

  // Test 2: POST Search Product
  const searchPayload = 'search_product=shirt';
  const searchResponse = http.post(
    `${BASE_URL}/api/searchProduct`,
    searchPayload,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  check(searchResponse, {
    'Search Product: status is 200': (r) => r.status === 200,
    'Search Product: response time < 2000ms': (r) => r.timings.duration < 2000,
    'Search Product: returns results': (r) => {
      const body = JSON.parse(r.body);
      return body.responseCode === 200;
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n' + indent + '========== k6 Demo Test Summary ==========\n';
  summary += indent + `Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += indent + `VUs: ${data.options.vus}\n`;
  summary += indent + `Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += indent + `HTTP Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}\n`;
  summary += indent + `Request Duration (avg): ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0}ms\n`;
  summary += indent + `Request Duration (p95): ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms\n`;
  summary += indent + `Failed Requests: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%\n`;
  summary += indent + '==========================================\n\n';
  
  return summary;
}
