# SpendWise AI — Financial Calculation Rules & Accounting Engine

This document defines the mathematical models, accounting principles, and edge-case behaviors implemented in the single shared calculation engine: [`FinancialCalculatorService`](file:///c:/Users/tavig/Desktop/paypal/apps/api/src/services/financial-calculator.service.ts).

---

## 1. Core Principles

1. **Integer Minor Units Precision**:
   - All monetary figures are handled strictly in integer minor units (e.g. cents for USD/EUR, paise for INR).
   - Floating-point arithmetic (`0.1 + 0.2 = 0.30000000000000004`) is strictly forbidden for financial calculations.
   
2. **Transaction Eligibility**:
   - Realised financial totals include **only** transactions with `status === 'completed'`.
   - Transactions with status `pending`, `failed`, or `cancelled` are strictly excluded from spending summaries, budget utilization, and savings rates.
   - Pending transactions are tracked separately and presented with clear pending indicators.

3. **Internal Transfers Exclusion**:
   - Transactions marked as `transfer` (e.g. automated transfers to High-Yield Savings Accounts or brokerage accounts) are completely excluded from both income and expenditure metrics.
   - Transfers to savings represent asset reallocation, not consumption.

4. **Income Schedule Separation**:
   - User-confirmed expected income schedules are maintained independently from received-income transactions to prevent double counting.

5. **Multi-Currency Segregation**:
   - Multi-currency sums are never calculated without documented explicit conversion rates. Transactions in non-target currencies are segregated and omitted from single-currency ledgers.

---

## 2. Mathematical Formulations

### A. Received Income
$$\text{Received Income} = \sum \text{amountMinor} \quad \text{for all completed income transactions in period}$$

### B. Gross Expenditure & Refunds
$$\text{Gross Expenditure} = \sum \text{amountMinor} \quad \text{for all completed expense transactions in period}$$
$$\text{Refunds} = \sum \text{amountMinor} \quad \text{for all completed refund transactions in period}$$

*Refund Attribution*: Refunds offset category expenditure on a cash-flow basis during the reporting period in which the refund occurred.

### C. Realised Net Expenditure
$$\text{Net Expenditure} = \max(0, \text{Gross Expenditure} - \text{Refunds})$$

### D. Recorded Net Surplus
$$\text{Recorded Net Surplus} = \text{Received Income} - \text{Net Expenditure}$$

### E. Savings Rate
$$\text{Savings Rate} = \begin{cases} 
\dfrac{\text{Recorded Net Surplus}}{\text{Received Income}} \times 100 & \text{if Received Income} > 0 \\
\text{null ("Not available")} & \text{if Received Income} \le 0
\end{cases}$$

*Zero-Income Rule*: When recorded income is zero, the savings rate is undefined and displayed explicitly as `"Not available"` rather than `0%` or `-Infinity`.

### F. Budget Utilisation & Remaining Budget
$$\text{Utilisation Percentage} = \begin{cases} 
\dfrac{\text{Realised Spent in Category}}{\text{Allocated Category Budget}} \times 100 & \text{if Allocated} > 0 \\
100\% & \text{if Allocated} = 0 \text{ and Spent} > 0 \\
0\% & \text{if Allocated} = 0 \text{ and Spent} = 0
\end{cases}$$

$$\text{Remaining Budget} = \text{Allocated Budget} - \text{Realised Spent in Category}$$

*Caution Levels*:
- `normal`: Utilisation $< 85\%$ and Remaining $\ge 0$.
- `warning` (Orange): $85\% \le \text{Utilisation} \le 100\%$ and Remaining $\ge 0$.
- `exceeded` (Red): Utilisation $> 100\%$ or Remaining $< 0$.

### G. Immediate Effect of a Purchase on Remaining Budget
$$\text{Remaining Before Purchase} = \text{Allocated Category Budget} - \text{Spent So Far}$$
$$\text{Estimated Remaining After Purchase} = \text{Remaining Before Purchase} - \text{Total Delivered Cost}$$
$$\text{Excess} = \begin{cases}
0 & \text{if Estimated Remaining After} \ge 0 \\
|\text{Estimated Remaining After}| & \text{if Estimated Remaining After} < 0
\end{cases}$$

---

## 3. Smarter Product Search Delivered Cost Formula

$$\text{Total Delivered Cost} = \text{Item Subtotal} + \text{Shipping} + \text{Taxes} + \text{Mandatory Fees} - \text{Verified Applicable Discounts}$$

- If any pricing component (taxes, shipping, fees) is unverified or missing from the merchant feed, the offer is explicitly tagged as `"Estimated total"` or `"Total incomplete"`.
- Incomplete totals are never ranked as definitively cheapest.
- Unit prices are calculated and displayed when comparing different pack sizes.
- Differences between offers are labeled as **potential savings**, never claimed as realized savings until purchase.

---

## 4. Cohort Threshold & Peer Context Safeguards

- Cohorts require a configurable minimum sample size of **30 distinct participants**.
- If $N < 30$, the system displays **"Insufficient comparable data"** instead of synthesizing artificial numbers.
- Benchmarks are displayed with median and interquartile distribution ($25^{\text{th}}$ and $75^{\text{th}}$ percentiles).
- Spending below the median is never framed as inherently virtuous without regard to essential nutrition, shelter, and health.
