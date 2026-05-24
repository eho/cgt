# CGT Impact Calculator

Status: Draft

## Context

The 2026-27 Australian Federal Budget announced CGT and negative gearing reforms that materially affect investment property and share investors from 1 July 2027. The research baseline is captured in [CGT reform research notes](../planning/cgt-reform-research.md).

This design proposes a web app that models the financial impact of those reforms for a user's portfolio.

A static visual mockup is available at [CGT impact calculator mockups](mockups/cgt-impact-calculator-mockups.html).

## Scope

### MVP

- Australian resident individual tax profile.
- Investment properties owned directly by the user.
- Share, ETF, and managed-fund parcels owned directly by the user.
- Current-rules versus announced-reform comparison.
- Sale scenario modelling for dates before and after 1 July 2027.
- Transitional split for assets owned before 1 July 2027.
- CPI indexation assumptions with manual CPI override.
- 30% minimum-tax estimate on post-2027 real capital gains.
- Negative gearing status and rental loss carry-forward modelling for residential property.
- Scenario summary export as a printable page or PDF.

### Later

- Joint ownership and spouse-level allocation.
- Trust ownership, including the announced discretionary trust minimum tax from 1 July 2028.
- Company ownership.
- Foreign and temporary resident CGT rules.
- Affordable housing 60% CGT discount.
- Main residence partial exemption and six-year rule.
- Small business CGT concessions.
- Crypto and other CGT assets.
- Broker import, CSV import, and property data enrichment.

## User Questions

The app should be organised around concrete questions:

- What happens if I sell this property in FY2027 versus FY2028?
- How much of my gain is protected by the old 50% discount?
- How much post-2027 gain is taxable after CPI indexation?
- Would the 30% minimum tax affect me if I sell during a low-income year?
- Is this property grandfathered for negative gearing?
- If I buy another property, how does established property compare with a new build?
- Which asset has the largest policy-driven tax delta?

## Information Architecture

### Portfolio

Shows all assets and the app's classification:

- Properties
- Share parcels
- Other assets, later

Each row shows:

- asset name;
- owner and ownership share;
- acquisition date;
- cost base;
- current estimated value;
- held before 12 May 2026 announcement, before 1 July 2027, or after 1 July 2027;
- CGT method status;
- negative gearing status for property;
- estimated unrealised gain;
- policy exposure badge.

### Asset Detail

Property fields:

- property name and address label;
- residential, commercial, or mixed use;
- established or eligible new build;
- contract date and settlement date;
- ownership share;
- purchase price;
- stamp duty;
- buying costs;
- capital improvements;
- selling cost estimate;
- loan balance;
- interest rate or annual interest;
- annual rent;
- annual deductible expenses;
- depreciation/capital works deductions;
- current value;
- 1 July 2027 value, if known;
- CGT exemptions or special status.

Share parcel fields:

- holding name/ticker;
- parcel acquisition date;
- units;
- cost per unit;
- brokerage and cost-base adjustments;
- current price;
- planned sale price/date;
- 1 July 2027 price, if known;
- dividend reinvestment and parcel method support, later.

### Scenario Builder

Inputs:

- tax year;
- sale date;
- sale price;
- non-CGT taxable income;
- carried-forward capital losses;
- income support exemption for minimum tax;
- CPI assumption mode;
- inflation forecast;
- asset growth forecast;
- property rental forecast;
- interest-rate forecast.

Outputs:

- taxable gain under current rules;
- estimated tax under current rules;
- taxable gain under reform rules;
- minimum-tax top-up, if any;
- rental loss benefit or carried-forward loss;
- after-tax sale proceeds;
- total delta;
- explanation of top drivers.

### Compare

A comparison view should show:

- sell before 1 July 2027;
- sell after 1 July 2027 using base assumptions;
- sell after 1 July 2027 with low inflation/high growth;
- sell after 1 July 2027 with high inflation/low growth;
- for new builds, best of 50% discount versus indexation/minimum-tax method.

### Assumptions And Sources

Every scenario should have an assumptions panel:

- tax resident individual;
- direct ownership;
- current tax rates used;
- CPI source and forecast values;
- policy source links;
- unresolved legislative details.

## Calculation Model

### Core Types

```ts
type AssetKind = "residential_property" | "commercial_property" | "share_parcel";
type OwnershipEntity = "individual" | "joint_individuals" | "trust" | "company" | "smsf";

type TaxProfile = {
  residency: "australian_resident" | "foreign_resident";
  ownershipEntity: OwnershipEntity;
  nonCgtTaxableIncome: number;
  receivesIncomeSupport: boolean;
  carriedForwardCapitalLosses: number;
};

type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  acquisitionDate: string;
  ownershipShare: number;
  costBase: number;
  currentValue?: number;
  valueAtPolicyStart?: number;
  isEligibleNewBuild?: boolean;
  heldBeforeBudgetAnnouncement?: boolean;
};

type SaleScenario = {
  assetId: string;
  saleDate: string;
  saleProceeds: number;
  sellingCosts: number;
  cpiAtAcquisition?: number;
  cpiAtPolicyStart?: number;
  cpiAtSale?: number;
};
```

### Current Rules Engine

```text
net_proceeds = sale_proceeds - selling_costs
nominal_gain = net_proceeds - cost_base
gain_after_losses = max(0, nominal_gain - capital_losses_applied)

if held_at_least_12_months and eligible_for_discount:
  taxable_gain = gain_after_losses * 0.5
else:
  taxable_gain = gain_after_losses

tax = income_tax(non_cgt_income + taxable_gain) - income_tax(non_cgt_income)
```

### Reform Rules Engine

For sale before 1 July 2027:

- use current rules.

For assets held less than 12 months:

- use the short-term CGT path: no 50% discount and no indexation;
- flag this as an assumption to revisit when legislation and ATO guidance finalise the reform details.

For asset acquired on or after 1 July 2027:

```text
indexed_cost_base = cost_base * cpi_at_sale / cpi_at_acquisition
real_gain = max(0, net_proceeds - indexed_cost_base)
ordinary_tax = income_tax(non_cgt_income + real_gain) - income_tax(non_cgt_income)
minimum_top_up = max(0, real_gain * 0.30 - ordinary_tax)
tax = ordinary_tax + minimum_top_up
```

For asset acquired before 1 July 2027 and sold after 1 July 2027:

```text
policy_start_value = user_value_at_1_july_2027 or estimated_policy_start_value

pre_policy_gain = max(0, policy_start_value - cost_base)
pre_policy_taxable_gain = pre_policy_gain * 0.5

post_policy_indexed_base = policy_start_value * cpi_at_sale / cpi_at_policy_start
post_policy_real_gain = max(0, net_proceeds - post_policy_indexed_base)

ordinary_taxable_gain = pre_policy_taxable_gain + post_policy_real_gain
ordinary_tax = income_tax(non_cgt_income + ordinary_taxable_gain) - income_tax(non_cgt_income)

minimum_tax_on_post_policy_gain = post_policy_real_gain * 0.30
ordinary_tax_on_post_policy_gain = allocate_tax_to_post_policy_gain(...)
minimum_top_up = max(0, minimum_tax_on_post_policy_gain - ordinary_tax_on_post_policy_gain)

tax = ordinary_tax + minimum_top_up
```

The first version should implement tax allocation as a documented estimate:

```text
ordinary_tax_on_post_policy_gain =
  income_tax(non_cgt_income + pre_policy_taxable_gain + post_policy_real_gain)
  - income_tax(non_cgt_income + pre_policy_taxable_gain)
```

This isolates the marginal tax effect of the post-policy real gain.

### New Build Choice

For eligible new residential builds, calculate both:

- old 50% discount method; and
- new indexation/minimum-tax method.

Then present:

- method with lower tax;
- difference;
- reason.

### Negative Gearing Engine

For each residential property and tax year:

```text
net_rental_result = rent - interest - deductible_expenses - allowed_depreciation
```

Classification:

- If property is eligible new build: loss offsets non-property income under current treatment.
- If property was held before 7:30pm AEST 12 May 2026: loss offsets non-property income until sold.
- If established residential property was acquired after 7:30pm AEST 12 May 2026: from 1 July 2027, loss can offset only residential property income or residential property capital gains; excess is carried forward.
- Commercial property and shares keep existing treatment.

Outputs:

- immediate tax benefit;
- quarantined loss;
- carried-forward loss balance;
- later use against positive rent or residential property capital gain.

## UI Design

The first screen should be the portfolio workspace, not a marketing page.

### Layout

- Left navigation: Portfolio, Scenarios, Compare, Assumptions, Sources.
- Main area: dense tables and focused panels.
- Right inspector: selected asset or scenario summary.

### Visual Style

- Quiet, financial-tool interface.
- Neutral background, high contrast text, restrained color.
- Use color only for semantic deltas: increase tax, decrease tax, unchanged, uncertain.
- Avoid decorative cards. Use tables, segmented controls, tabs, and inline detail panels.
- Use icons for actions such as add, duplicate, export, inspect, and delete.

### Core Screens

#### Portfolio Screen

Primary actions:

- Add property
- Add share parcel
- Import CSV, later

Table columns:

- Asset
- Type
- Acquired
- Cost base
- Current value
- Unrealised gain
- Reform exposure
- Negative gearing status
- Next action

Exposure badges:

- Grandfathered property
- Post-2027 CGT exposed
- New build choice
- Minimum-tax risk
- Needs 1 July 2027 value
- Rule detail pending

#### Scenario Screen

Use a split layout:

- left: scenario inputs;
- centre: results waterfall;
- right: explanation and assumptions.

Controls:

- sale date date picker;
- sale price input;
- non-CGT income input;
- tax year selector;
- CPI assumption selector;
- income support exemption toggle;
- include/exclude capital losses toggle.

#### Compare Screen

Show side-by-side scenarios:

- Current law
- Reform base case
- Low inflation
- High inflation
- Low income year

Key metrics:

- taxable gain;
- income tax on gain;
- minimum-tax top-up;
- annual rental deduction impact;
- carried-forward losses;
- after-tax proceeds;
- total delta.

#### Sources Screen

List policy sources, app assumptions, and date last researched.

## Technical Design

### Stack

Use the project stack from [tech stack](../architecture/tech-stack.md):

- Bun
- Vite
- React
- TypeScript, to add during scaffold

Recommended app additions:

- React Router for screens.
- Zustand or simple React context for local state in MVP.
- Zod for validating asset and scenario inputs.
- Decimal arithmetic library for money and percentages.
- IndexedDB or localStorage for private local persistence in MVP.
- Vitest for calculator unit tests.
- Playwright for critical UI scenario tests after app scaffold.

### Module Boundaries

```text
src/
  app/
    routes/
    layout/
  domain/
    cgt/
      currentRules.ts
      reform2027.ts
      negativeGearing.ts
      incomeTax.ts
      cpi.ts
      types.ts
    portfolio/
      assetTypes.ts
      scenarioTypes.ts
  data/
    policySources.ts
    residentTaxRates.ts
    samplePortfolio.ts
  ui/
    components/
    screens/
```

The calculator functions should be pure and heavily unit tested. UI components should call domain functions through view-model helpers, not embed formulas in JSX.

### Persistence

MVP:

- local-only browser storage;
- explicit "clear all data" action;
- no server, no login.

Later:

- encrypted sync;
- adviser sharing link;
- scenario export/import.

### Testing Strategy

Unit tests:

- current 50% discount calculation;
- under-12-month no-discount calculation;
- under-12-month reform ineligible path;
- post-2027 indexation calculation;
- transitional split calculation;
- minimum-tax top-up calculation;
- new build method choice;
- negative gearing grandfathering;
- rental loss carry-forward.

Golden examples:

- Reproduce Budget factsheet examples where possible.
- Include custom examples for property and shares.

UI tests:

- add property, run sale scenario, inspect explanation;
- add share parcel, compare before/after 1 July 2027;
- affected established property carries forward rental loss;
- new build shows method choice.

## Data Needed From User

For a useful estimate, the app should ask for:

- Australian tax residency and entity ownership.
- Expected taxable income in sale year, excluding capital gains.
- Whether the user receives income support in the sale year.
- Existing carried-forward capital losses.
- For each property: contract date, purchase cost base, ownership share, current value, estimated 1 July 2027 value, rent, interest, expenses, and new-build status.
- For each share parcel: acquisition date, cost base, units, current price, expected sale price, and 1 July 2027 quoted price or estimate.

## Product Questions For The User

These questions should guide the next design pass:

- Are your investment properties owned personally, jointly with a spouse, through a trust, through a company, or through an SMSF?
- Were all current investment properties acquired before 7:30pm AEST on 12 May 2026?
- Are any of your properties eligible affordable housing, commercial property, or former main residences?
- Do you want the first version to model only assets you already own, or also future purchase decisions?
- Do you want local-only private storage, or account-based sync across devices?
- Do you need CSV import from brokers or property spreadsheets in the MVP?

## Implementation Phases

### Phase 1: Calculator Kernel

- Define asset and scenario schemas.
- Implement income tax and current CGT calculations.
- Implement announced reform calculations with assumptions documented.
- Add tests around known examples.

### Phase 2: Portfolio UI

- Add Vite React app scaffold.
- Build asset entry and portfolio table.
- Add local persistence.

### Phase 3: Scenario UI

- Build sale scenario workflow.
- Show current versus reform deltas.
- Add explanation panel and source links.

### Phase 4: Property Cash Flow

- Add annual rental income/loss modelling.
- Add negative gearing classification and loss carry-forward.

### Phase 5: Polish And Export

- Add compare screen.
- Add printable scenario summary.
- Add assumptions/source review screen.
