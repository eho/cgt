# Current Design

This directory captures the currently implemented CGT Impact Calculator behavior.

## Application Shape

The app is a Vite React TypeScript single-page application. The first screen is a portfolio workspace, not a marketing landing page. Users can move between:

- Portfolio: local asset inventory for investment properties and share/ETF parcels.
- Scenarios: editable sale, tax profile, CPI, property loan, and property cash-flow assumptions.
- Compare: preset before/after reform, high/low income, and high/low CPI scenarios.
- Assumptions: tax-profile settings and explicit modelling assumptions.
- Sources: source links used by the product research.

Asset data is stored locally in browser `localStorage`. There is no server, account, or sync path in the MVP.

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
