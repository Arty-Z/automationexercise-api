# AutomationExercise API Testing Framework

A comprehensive Node.js + TypeScript automation project for API functional and performance testing using Playwright and k6.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Configuration](#configuration)
- [Test Scenarios](#test-scenarios)
- [Reports](#reports)
- [Documentation](#documentation)

## 🎯 Overview

This project provides a complete testing solution for the AutomationExercise API, including:

- **Functional API Tests** using Playwright for comprehensive endpoint validation
- **Performance & Load Tests** using k6 for stress testing and capacity planning
- **Prime Day / Cyber Monday Stress Scenario** to validate system capacity under peak loads

### Business Scenario

**Stress Test Scenario – Prime Day / Cyber Monday**

- **Last year peak**: 150 concurrent users
- **This year expected**: 200+ concurrent users
- **Goal**: Validate system can handle increased load

**Test Strategy**:
1. Start at 100 virtual users (comfortable zone)
2. Ramp up to 200 virtual users (expected peak)
3. Hold 200 users for 3 minutes
4. Monitor response times, error rates, and system resources

**Acceptance Criteria**:
- Response times must stay under 3 seconds for 95% of requests
- Error rate must stay below 1%

## 🛠 Tech Stack

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Playwright** (`@playwright/test`) - API functional testing
- **k6** - Load and stress testing
- **dotenv** - Environment configuration
- **npm** - Package manager

## 📁 Project Structure

```
automationexercise-api/
├── k6-reports/                    # k6 test reports
│   └── demo-test-report.html
├── k6-tests/                      # k6 performance tests
│   ├── demo-test.js               # Simple demo load test
│   └── load-test.js               # Prime Day stress test scenario
├── playwright-report/             # Playwright HTML reports
│   └── index.html
├── schemas/                       # API response schemas
│   ├── apiSchemas.ts              # TypeScript interfaces
│   ├── productsListSchema.json   # Products list JSON schema
│   └── searchProductSchema.json  # Search product JSON schema
├── test-results/                  # Test results and JUnit reports
├── tests/                         # Playwright API tests
│   ├── brandsList.spec.ts         # Brands list API tests
│   ├── productsList.spec.ts       # Products list API tests
│   └── searchProduct.spec.ts      # Search product API tests
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── apiTestLogic.md               # Test strategy documentation
├── automation-exercise-api.postman_collection.json
├── K6-PERFORMANCE-TESTING.md     # k6 testing guide
├── performance-testing-tools-comparison.md
├── performanceTestNotes.md       # Performance test notes
├── performanceTestScenariosForType.md
├── playwright.config.ts          # Playwright configuration
├── postman-curl-commands.md      # API curl examples
├── package.json                  # Project dependencies
├── package-lock.json
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **k6** - [Install k6](https://k6.io/docs/getting-started/installation/)

### Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd automationexercise-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   Update the `.env` file with your configuration:
   ```env
   BASE_URL=https://automationexercise.com
   ```

4. **Verify installation**:
   ```bash
   npx playwright --version
   k6 version
   ```

## 🚀 Running Tests

### Playwright API Tests

Run all functional tests:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:products     # Products list API tests
npm run test:search       # Search product API tests
npm run test:brands       # Brands list API tests
```

Run tests in headed mode (with browser UI):
```bash
npm run test:headed
```

Debug tests:
```bash
npm run test:debug
```

View test report:
```bash
npm run test:report
```

### k6 Performance Tests

Run demo load test (10 VUs for 30s):
```bash
npm run k6:demo
# OR
k6 run k6-tests/demo-test.js
```

Run Prime Day stress test (100→200 VUs):
```bash
npm run k6:stress
# OR
k6 run k6-tests/load-test.js
```

Run with custom environment variables:
```bash
k6 run -e BASE_URL=https://automationexercise.com k6-tests/load-test.js
```

Generate HTML report:
```bash
k6 run --out html=k6-reports/stress-test-report.html k6-tests/load-test.js
```

## ⚙ Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | API base URL | `https://automationexercise.com` |
| `K6_VUS_START` | k6 starting VUs | `100` |
| `K6_VUS_PEAK` | k6 peak VUs | `200` |
| `K6_DURATION_RAMP` | Ramp duration | `3m` |
| `K6_DURATION_HOLD` | Hold duration | `3m` |
| `MAX_RESPONSE_TIME_MS` | Max response time threshold | `3000` |
| `MAX_ERROR_RATE` | Max error rate threshold | `0.01` |

### Playwright Configuration

Edit `playwright.config.ts` to customize:
- Test directory
- Parallel execution
- Retry logic
- Reporters
- Timeouts

### k6 Configuration

Edit test files in `k6-tests/` to customize:
- Virtual users (VUs)
- Test duration
- Ramp patterns
- Thresholds
- Metrics

## 📊 Test Scenarios

### Functional Tests (Playwright)

1. **Products List API (`GET /api/productsList`)**
   - Status code validation
   - Response structure validation
   - Response time checks
   - Data integrity tests

2. **Search Product API (`POST /api/searchProduct`)**
   - Positive scenarios (valid search terms)
   - Negative scenarios (invalid/empty terms)
   - Search result validation
   - Case sensitivity tests

3. **Brands List API (`GET /api/brandsList`)**
   - Status code validation
   - Response structure validation
   - Data uniqueness tests

### Performance Tests (k6)

1. **Demo Test**
   - 10 concurrent users
   - 30-second duration
   - Basic load validation

2. **Prime Day Stress Test**
   - **Stage 1**: Ramp to 100 VUs (1 minute)
   - **Stage 2**: Ramp to 200 VUs (3 minutes)
   - **Stage 3**: Hold at 200 VUs (3 minutes)
   - **Stage 4**: Ramp down (1 minute)
   - Monitors both GET and POST endpoints
   - Validates response times and error rates

## 📈 Reports

### Playwright Reports

After running tests, view the HTML report:
```bash
npm run test:report
```

Reports are saved in:
- `playwright-report/` - HTML report
- `test-results/` - JUnit XML and raw results

### k6 Reports

k6 outputs detailed metrics to console including:
- Request duration (avg, p95, p99, max)
- Error rates
- Throughput
- Custom metrics per API

HTML reports can be generated with:
```bash
k6 run --out html=k6-reports/report.html k6-tests/load-test.js
```

## 📚 Documentation

Detailed documentation is available in separate markdown files:

- **[apiTestLogic.md](apiTestLogic.md)** - Overall test strategy and approach
- **[K6-PERFORMANCE-TESTING.md](K6-PERFORMANCE-TESTING.md)** - k6 testing guide and best practices
- **[performanceTestScenariosForType.md](performanceTestScenariosForType.md)** - Performance test types explained
- **[performanceTestNotes.md](performanceTestNotes.md)** - Implementation notes and assumptions
- **[performance-testing-tools-comparison.md](performance-testing-tools-comparison.md)** - Tool comparison
- **[postman-curl-commands.md](postman-curl-commands.md)** - Example API requests

## 🎯 APIs Under Test

### 1. GET Products List
- **Endpoint**: `/api/productsList`
- **Method**: GET
- **Response**: JSON with products array
- **Use Case**: Retrieve all available products

### 2. POST Search Product
- **Endpoint**: `/api/searchProduct`
- **Method**: POST
- **Content-Type**: `application/x-www-form-urlencoded`
- **Body**: `search_product=<search_term>`
- **Response**: JSON with matching products
- **Use Case**: Search for products by keyword

### 3. GET Brands List
- **Endpoint**: `/api/brandsList`
- **Method**: GET
- **Response**: JSON with brands array
- **Use Case**: Retrieve all available brands

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure they pass
5. Submit a pull request

## 📝 License

ISC

## 👥 Author

SDET Team

---

**Note**: This project is designed for testing purposes. Ensure you have proper authorization before running load tests against production systems.
