# Current Design

This directory captures the currently implemented CGT Impact Calculator behavior.

## Application Shape

The app is a Vite React TypeScript single-page application. The first screen is a portfolio workspace, not a marketing landing page. Users can move between:

- Portfolio: local asset inventory for investment properties and share/ETF parcels, with an inline asset-detail editor for the selected row.
- Scenarios: editable sale, tax profile, CPI, property loan, and property cash-flow assumptions.
- Compare: best-next-move guidance, ranked full-sale scenarios, before/after reform timing, high/low income, high/low CPI, and staged share-sale planning estimates.
- Assumptions: tax-profile settings and explicit modelling assumptions.
- Sources: source links used by the product research.

Asset data is stored locally in browser `localStorage`. There is no server, account, or sync path in the MVP.

The portfolio editor supports the real-world entry fields needed for the MVP:

- properties: address label, acquisition/contract date, settlement date, ownership share, purchase price, stamp duty, buying costs, capital improvements, calculated cost base, current value, 1 July 2027 value, expected sale date/price, selling costs, loan balance, interest rate, calculated annual interest, optional annual-interest override, rent, deductible expenses, depreciation/capital works, and eligible-new-build status;
- share/ETF parcels: units, cost per unit, brokerage, cost-base adjustments, calculated cost base, current unit price, calculated current value, 1 July 2027 unit price/calculated value, expected sale date, expected sale unit price/calculated sale value, and selling costs.

The scenario and compare screens are decision-oriented rather than only numeric. They surface plain-English next moves, such as testing a lower-income sale year, checking the 1 July 2027 valuation, reviewing minimum-tax exposure, or comparing staged share sales. Share parcel comparison includes 25%, 50%, and 50% + 50% staged-sale planning rows. Multi-stage rows sequence carried-forward capital losses across stages so the same loss is not counted twice in the estimate.

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
