import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * k6 Spike Test - Super Bowl Ad Scenario
 * 
 * Scenario:
 * - Baseline: 10 users browsing normally
 * - SPIKE 1: 30 seconds to reach 300 users (30-second Super Bowl ad airs)
 * - Hold: 1 minute at 300 users (people typing URL, clicking)
 * - Recovery: Drop to 50 users (curious browsers stick around)
 * - SPIKE 2: Another wave as people share on social media (400 users)
 * - Ramp down: Traffic normalizes back to baseline
 * 
 * Acceptance Criteria:
 * - Response times must stay under 5 seconds even during spikes
 * - Error rate must stay below 5% (some failures acceptable during extreme spike)
 * - System must recover gracefully after spike
 * 
 * Purpose: Validate auto-scaling, queue systems, and graceful degradation
 * Real Impact: One chance - if site crashes during ad, $7M wasted
 */

// Custom metrics
const productsListDuration = new Trend('products_list_duration', true);
const searchProductDuration = new Trend('search_product_duration', true);
const errorRate = new Rate('errors');
const spikeRecovery = new Trend('spike_recovery_time', true);

export const options = {
  stages: [
    // Baseline: Normal browsing before the ad
    { duration: '1m', target: 10 },     // Baseline: 10 users browsing normally
    
    // SPIKE 1: Super Bowl ad airs - TRAFFIC EXPLOSION
    { duration: '30s', target: 300 },   // SPIKE! 30-second ad drives massive traffic
    
    // Hold: People typing URL, clicking through
    { duration: '1m', target: 300 },    // Hold at 300 users (people typing in URL)
    
    // Recovery: Some users bounce, curious ones stay
    { duration: '30s', target: 50 },    // Drop to 50 (curious browsers stick around)
    
    // SPIKE 2: Social media sharing wave
    { duration: '30s', target: 400 },   // SPIKE 2! Social media sharing (400 users)
    { duration: '1m', target: 400 },    // Hold at peak social media traffic
    
    // Ramp down: Traffic normalizes
    { duration: '1m', target: 50 },     // Gradual decline as interest wanes
    { duration: '30s', target: 10 },    // Back to baseline
  ],
  
  thresholds: {
    // During spike, allow higher response times (5s instead of 3s)
    'http_req_duration': ['p(95)<5000'],
    
    // Per-API thresholds
    'http_req_duration{api_type:products_list}': ['p(95)<5000'],
    'http_req_duration{api_type:search_product}': ['p(95)<5000'],
    
    // Allow 5% error rate during extreme spike (some failures acceptable)
    'http_req_failed': ['rate<0.05'],
    
    // Custom error tracking
    'errors': ['rate<0.05'],
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
    'Products List: response time < 5000ms': (r) => r.timings.duration < 5000,
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
  
  // Very short pause - spike traffic users are impatient
  sleep(0.3);

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
    'Search Product: response time < 5000ms': (r) => r.timings.duration < 5000,
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

  // Spike traffic users have minimal think time
  sleep(0.5);
}

/**
 * Setup function - runs once at the beginning
 */
export function setup() {
  console.log('🏈 Starting Super Bowl Ad Spike Test');
  console.log('📺 Scenario: 30-second Super Bowl ad just aired');
  console.log('💰 Cost: $7 million - ONE CHANCE to get this right');
  console.log('');
  console.log('📊 Traffic Pattern:');
  console.log('   Baseline: 10 users (normal browsing)');
  console.log('   ⚡ SPIKE 1: 0→300 users in 30 seconds (ad airs)');
  console.log('   📱 Hold: 300 users for 1 minute (typing URL)');
  console.log('   📉 Recovery: Drop to 50 users (bounces)');
  console.log('   ⚡ SPIKE 2: 50→400 users in 30s (social media sharing)');
  console.log('   📉 Normalize: Back to baseline');
  console.log('');
  console.log('🎯 Acceptance: p95 < 5s, Error rate < 5% during spike');
  console.log('');
  console.log('⚠️  Critical Infrastructure Requirements:');
  console.log('   ✅ Auto-scaling must kick in within 30 seconds');
  console.log('   ✅ CDN caching for static content');
  console.log('   ✅ Queue system to handle overflow');
  console.log('   ✅ Graceful degradation (cached content if needed)');
  console.log('');
  console.log('📖 Real-World Example:');
  console.log('   GoDaddy crashed during early Super Bowl ads');
  console.log('   Now they pre-scale infrastructure before ad airs');
  console.log('');
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  console.log('');
  console.log('✅ Super Bowl spike test completed');
  console.log('📈 Check summary above for detailed metrics');
  console.log('');
  console.log('🔧 Post-Test Analysis Questions:');
  console.log('   1. Did the site stay up during BOTH spikes?');
  console.log('   2. Did auto-scaling engage fast enough (< 30 seconds)?');
  console.log('   3. What was the error rate during peak (300 & 400 VUs)?');
  console.log('   4. Did response times stay under 5 seconds?');
  console.log('   5. Did the system recover gracefully after spikes?');
  console.log('');
  console.log('💡 If Test Failed:');
  console.log('   - Pre-scale infrastructure BEFORE ad airs');
  console.log('   - Implement aggressive CDN caching');
  console.log('   - Add request queuing/rate limiting');
  console.log('   - Consider static "holding page" during extreme load');
  console.log('');
}

/**
 * Custom summary handler
 */
export function handleSummary(data) {
  console.log('');
  console.log('========================================');
  console.log('  SUPER BOWL AD SPIKE TEST - RESULTS');
  console.log('========================================');
  console.log('');
  console.log('Test Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  console.log(`  Peak VUs: 400 (SPIKE 2)`);
  console.log(`  Ad Cost: $7,000,000 💰`);
  console.log('');
  console.log('Overall Metrics:');
  console.log(`  Total Requests: ${data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0}`);
  console.log(`  Iterations: ${data.metrics.iterations.values.count}`);
  console.log(`  Failed Requests: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}% (Threshold: <5%)`);
  console.log('');
  console.log('Response Time Analysis:');
  console.log(`  Average: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg.toFixed(2) : 0}ms`);
  console.log(`  Median (p50): ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.med.toFixed(2) : 0}ms`);
  console.log(`  p90: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(90)'].toFixed(2) : 0}ms`);
  console.log(`  p95: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'].toFixed(2) : 0}ms (Threshold: <5000ms)`);
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
  console.log('Spike Analysis:');
  console.log('  SPIKE 1 (0→300 in 30s):');
  console.log('    - Super Bowl ad aired');
  console.log('    - Did auto-scaling engage?');
  console.log('  SPIKE 2 (50→400 in 30s):');
  console.log('    - Social media sharing wave');
  console.log('    - Peak traffic moment');
  console.log('');
  console.log('Verdict:');
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0;
  const errorRateValue = data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate : 0;
  
  if (p95 < 5000 && errorRateValue < 0.05) {
    console.log('  ✅ PASSED - Site survived the Super Bowl ad!');
    console.log('  ✅ Response times acceptable during spikes (p95 < 5s)');
    console.log('  ✅ Error rate acceptable (<5%)');
    console.log('  🎉 $7M ad investment protected!');
    console.log('');
    console.log('  💡 Recommendations:');
    console.log('     - Still pre-scale before ad airs (safety margin)');
    console.log('     - Monitor CDN cache hit rates');
    console.log('     - Have incident response team on standby');
  } else {
    console.log('  ❌ FAILED - Site would crash during Super Bowl ad');
    console.log('  💸 $7,000,000 WASTED - Site unavailable during ad');
    console.log('');
    if (p95 >= 5000) {
      console.log(`  ❌ Response times too high: p95=${p95.toFixed(2)}ms (threshold: 5000ms)`);
      console.log('     Users would see loading spinners, then give up');
    }
    if (errorRateValue >= 0.05) {
      console.log(`  ❌ Error rate too high: ${(errorRateValue * 100).toFixed(2)}% (threshold: 5%)`);
      console.log('     Many users would see error pages');
    }
    console.log('');
    console.log('  🚨 CRITICAL ACTIONS REQUIRED:');
    console.log('     1. PRE-SCALE infrastructure before ad airs');
    console.log('     2. Implement CDN for all static assets');
    console.log('     3. Add request queue/rate limiting');
    console.log('     4. Create static "high traffic" holding page');
    console.log('     5. Configure auto-scaling to trigger at 50% capacity');
    console.log('     6. Load test again after fixes');
    console.log('');
    console.log('  📖 Learn from GoDaddy: They now scale BEFORE ads air');
  }
  console.log('');
  console.log('========================================');
  console.log('');
  
  return {
    'stdout': '', // Summary already printed above
  };
}
