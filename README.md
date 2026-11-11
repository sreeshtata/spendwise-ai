# SpendWise AI — Smart Spending Assistant

[![Hackathon Prototype](https://img.shields.io/badge/PayPal_Hackathon-Prototype_2024-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-15%2F15_Passed-success.svg)](#testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

**SpendWise AI** is an independent, full-stack spending intelligence application prototype connected to the PayPal Sandbox. It is designed to help users understand their spending patterns, create realistic budgets with protected essential spending, and make informed purchasing decisions with total delivered cost transparency.

> **Hackathon Prototype Notice**: SpendWise AI is an independent prototype connected to the PayPal Sandbox for demonstration checkout workflows. It is not an official PayPal product nor operated inside PayPal's live consumer portal.

---

## 1. Core Features

SpendWise AI implements **exactly three core features** sharing one database, authenticated session, transaction history, and financial engine:

1. **Smart Budget Plans**:
   - Monthly envelope management with protected essential spending minimums (Housing $1,650, Groceries $500, Utilities $180, Transit $150, Health $65).
   - Deterministic baseline budget calculated in the backend from 90 days of verified transaction history.
   - Structured AI recommendations proposing realistic discretionary reallocations.
   - Infeasible budget detection (essential obligations are never silently cut to balance a budget).
   - Direct bridge: **"Find options within this budget"** opens Smarter Product Search with pre-filled capacity.

2. **Smarter Product Search**:
   - Multi-attribute query inputs (Description, Purchase Purpose, Max Budget, Location, Specs).
   - Channel3 backend adapter separating **Same Product across different merchants** from **Vetted Alternatives** that fit the same purpose.
   - 9-Column AG Grid Community product comparison table.
   - Total delivered cost calculation: $\text{Item Subtotal} + \text{Shipping} + \text{Taxes} + \text{Mandatory Fees} - \text{Discounts}$.
   - Sourced reviews and ratings with source URLs, review count, and scope (never mixes merchant reputation with product ratings).
   - Immediate budget effect calculation (remaining budget before purchase, estimated remaining after purchase).
   - Potential savings comparison between offers.

3. **Spending Intelligence**:
   - **Tab A: Peer Spending Context**:
     - Anonymized cohort comparison matched by Age Band, Employment Status, and Purpose.
     - Strict **minimum 30-participant threshold** (displays *"Insufficient comparable data"* if $N < 30$ rather than inventing benchmarks).
     - Median, 25th percentile, and 75th percentile distributions.
     - Clearly labeled synthetic demo benchmarks with comparability limitation disclosures.
   - **Tab B: My Spending Progress**:
     - Meaningfully aligned historical periods (Month vs Prior-Year Month, YTD vs Prior YTD, Prior Month).
     - Verified received income, net expenditure, recorded net surplus, and savings rate difference.
     - Category-by-category changes (minor units and percentage).
     - Recurring commitment changes (subscription expansion/reduction).
     - Data coverage disclosures.

---

## 2. Technology Stack

- **Frontend (`apps/web`)**:
  - React 18, Vite, TypeScript
  - Tailwind CSS (Navy `#0A2540` primary, emerald positive, amber caution, red error)
  - Lucide React
  - React Router (mountable under configurable basename e.g. `/` or `/assistant`)
  - TanStack Query (server state & caching)
  - AG Grid Community (Transactions & Product Comparison tables)
  - Recharts (Budget, Cohort, and Trend charts)
- **Backend (`apps/api`)**:
  - Node.js 20, Express, TypeScript
  - OpenAPI 3.1 contract served via Swagger UI at `/api/v1/docs`
  - Zod runtime validation schemas
  - Single shared financial calculation engine ([`FinancialCalculatorService`](docs/CALCULATIONS.md))
- **Contracts & SDK (`packages/contracts`)**:
  - Shared TypeScript types, Zod schemas, OpenAPI 3.1 specification, and APIMatic-generated client SDK.
- **Database & Auth (`supabase/`)**:
  - PostgreSQL schema with 19 tables, Row Level Security (RLS) policies, and 2-year deterministic fixtures.
- **External Integrations**:
  - **PayPal Sandbox**: Real test payment order creation, simulated or popup approval, capture verification, and idempotent ledger recording.
  - **Channel3**: E-Commerce product discovery with complete delivered cost breakdowns.
  - **APIMatic**: TypeScript SDK generated from OpenAPI 3.1.
  - **Elasticsearch**: Asynchronous outbox search with seamless database search fallback.
  - **AI Service**: Google Gemini API integration with structured schemas and verified rules fallback.
  - **Postman**: Executable API collection and environment template.
  - **Render**: Production deployment configuration via `render.yaml`.

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js 18+ or 20+
- pnpm 8+ or 9+ (or npm)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Monorepo Packages
```bash
pnpm run build
```

### 3. Run Automated Tests
```bash
pnpm run test
```
All 15 automated unit and integration tests will execute and verify financial math, RLS cross-user isolation, Elasticsearch fallback, and PayPal capture idempotency.

### 4. Start Development Servers
```bash
# Start backend API (http://localhost:3001)
pnpm run dev:api

# Start frontend web app (http://localhost:3000)
pnpm run dev:web
```

Open your browser at `http://localhost:3000`.

---

## 4. Fictional Demo Account (2-Year Deterministic Data)

SpendWise AI includes a built-in deterministic demo dataset for **Alex Morgan** spanning 24 months (2023 - 2024):
- **Expected Salary**: $5,200.00 / mo ($2,600 biweekly via direct deposit).
- **Essential Fixed Commitments**: Apartment Rent ($1,650/mo), High-Speed Internet ($75/mo), Utilities ($180/mo).
- **Discretionary Recurring**: Health Club ($65/mo), Digital Streaming Media ($45/mo).
- **Spending Behavior Variation**:
  - Demonstrated high-savings periods (Q4 2023 with 32% savings rate).
  - Demonstrated discretionary increase (Dining surged from $300/mo to $650/mo in recent months, creating a budget optimization opportunity).
  - Cross-user isolation account: **Jordan Lee** (`demo-user-2`) to verify that private transactions are inaccessible to other users.

---

## 5. 3-Minute Walkthrough Demo Script

1. **Overview & Insight**:
   - Sign in as Alex Morgan.
   - Inspect the **Current Accounting Period** summary: Received Income ($5,200), Net Expenditure ($3,420), Recorded Surplus ($1,780), and Savings Rate (34.2%).
   - Notice the caution indicator on Dining & Drinks (exceeding planned allocation).

2. **Smart Budget Plans (Feature 1)**:
   - Navigate to **Smart Budget Plans**.
   - Review active allocations with protected essential minimum constraint locks (Rent $1,650, Groceries $500).
   - Inspect the **AI Structured Budget Adjustments** card: AI identifies that moderating dining and consolidating digital subscriptions unlocks $150 in monthly savings.
   - Click **"Find tech options within this $350 budget"** on the Tech & Electronics recommendation.

3. **Smarter Product Search (Feature 2)**:
   - The query carries over to **Smarter Product Search** for work headphones with a $400 budget ceiling.
   - Examine the **Immediate Budget Impact Simulation**: shows remaining tech budget before ($230.00) and estimated remaining after purchase.
   - Inspect the **Same Product, Different Merchants** AG Grid table: compares Sony WH-1000XM5 across Best Buy ($362.99 delivered) vs Amazon ($375.84 delivered).
   - Inspect the **Alternative Products** section: highlights the Anker Soundcore Space Q45 ($120.39 delivered), unlocking **$242.60 in potential savings** within the tech budget.

4. **PayPal Sandbox Payment**:
   - Click **"Sandbox Demonstration Buy"** on the Anker Space Q45.
   - The clearly separated **PayPal Sandbox Demonstration Checkout** modal opens.
   - Click **"Initialize PayPal Order"** $\rightarrow$ order `PAYPAL-TEST-xxxx` is generated.
   - Click **"Simulate Buyer Approval & Capture"** $\rightarrow$ capture `CAP-xxxx` completes.
   - The transaction is recorded in the ledger with verified capture reference.

5. **Updated Intelligence (Feature 3)**:
   - Close the modal and navigate to **Overview** / **Transactions**: the new Sandbox purchase is recorded, updating the tech category utilization in real-time.
   - Open **Spending Intelligence**:
     - *Peer Spending Context*: select Dining & Leisure $\rightarrow$ shows you are $270 above the cohort median of $380 (based on 98 verified participants).
     - Switch to Niche Specialty $\rightarrow$ shows **"Insufficient comparable data"** because cohort size (18) is below the 30-participant threshold.
     - *My Spending Progress*: select Prior-Year Month $\rightarrow$ compares Nov 2024 vs Nov 2023 with verified savings rate differences and category changes.

> **Walkthrough Video Note**: An automated video recording tool was not present in this headless environment; the deterministic demo script above documents the end-to-end verified workflow.

---

## 6. API Documentation & Postman

- **Interactive OpenAPI 3.1 Swagger UI**: `http://localhost:3001/api/v1/docs`
- **OpenAPI JSON Spec**: `http://localhost:3001/api/v1/openapi.json`
- **Postman Collection**: [`postman/SpendWise_AI.postman_collection.json`](postman/SpendWise_AI.postman_collection.json)
- **Postman Environment**: [`postman/SpendWise_AI.postman_environment.json`](postman/SpendWise_AI.postman_environment.json)

---

## 7. Deployment Configuration

The repository includes a ready-to-deploy [`render.yaml`](render.yaml) blueprint:
- `spendwise-api`: Node.js web service running `node apps/api/dist/index.js`.
- `spendwise-web`: Static web service publishing `apps/web/dist` with client-side SPA rewrite rules.

---

## 8. License

SpendWise AI is open-source software licensed under the [MIT License](LICENSE).
