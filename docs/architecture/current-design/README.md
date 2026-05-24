# Current Design

This directory captures the currently implemented CGT Impact Calculator behavior.

## Application Shape

The app is a Vite React TypeScript single-page application. The first screen is a portfolio workspace, not a marketing landing page. Users can move between:

- Portfolio: local asset inventory for investment properties and share/ETF parcels, with an inline asset-detail editor for the selected row.
- Scenarios: editable sale, tax profile, CPI, property loan, and property cash-flow assumptions.
- Compare: preset before/after reform, high/low income, and high/low CPI scenarios.
- Assumptions: tax-profile settings and explicit modelling assumptions.
- Sources: source links used by the product research.

Asset data is stored locally in browser `localStorage`. There is no server, account, or sync path in the MVP.

The portfolio editor supports the real-world entry fields needed for the MVP:

- properties: address label, acquisition/contract date, settlement date, ownership share, purchase price, stamp duty, buying costs, capital improvements, cost base used, current value, 1 July 2027 value, expected sale date/price, selling costs, loan balance, interest rate, annual interest, rent, deductible expenses, depreciation/capital works, and eligible-new-build status;
- share/ETF parcels: units, cost per unit, brokerage, cost-base adjustments, cost base used, current unit price, calculated current value, 1 July 2027 unit price/calculated value, expected sale date/price, and selling costs.

## Calculation Modules

Pure calculator functions live under `src/domain/cgt/`:

- `incomeTax.ts` versions Australian resident individual tax brackets by income year.
- `currentRules.ts` estimates current CGT, including carried-forward losses and the 12-month 50% discount test.
- `reform2027.ts` estimates the announced reform rules, including sales before 1 July 2027, short-term assumptions, CPI-indexed gains, transitional pre/post-2027 split, 30% minimum-tax top-up, and eligible-new-build method choice.
- `negativeGearing.ts` classifies residential property losses as grandfathered, new-build allowed, or quarantined from 1 July 2027.
- `calculator.ts` combines current-rules, reform-rules, and negative-gearing outputs for the UI.

The UI calls these domain functions through comparison view models; formulas are not embedded in React components.

## MVP Limits

The current implementation models Australian resident individual estimates only. It excludes Medicare levy, offsets, trusts, companies, SMSFs, spouse allocation, main residence rules, affordable housing, small business concessions, and final ATO rounding/detail that is still pending after the Budget announcement.
