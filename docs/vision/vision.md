# Vision

## Product Purpose

Build a personal investment tax impact modeller for Australians affected by the 2026-27 Budget CGT and negative gearing reforms.

The app helps an investor answer:

- How much more or less tax might I pay if I sell an investment property or share parcel after 1 July 2027?
- Which assets are most exposed to the change from the 50% CGT discount to CPI indexation?
- Does selling before or after 1 July 2027 materially change my result?
- Are my existing properties grandfathered for negative gearing?
- How do future purchases compare across established residential property, new builds, and shares?
- What assumptions are driving the estimate?

The product should make tax impact understandable without pretending to be a substitute for professional advice.

## Target User

The initial target user is an Australian resident individual investor who:

- owns one or more investment properties;
- owns shares, ETFs, or managed-fund parcels;
- may have mortgage interest, rental income, property expenses, or margin-loan interest;
- wants to compare current tax settings with the announced 2027 reform settings;
- needs a clear estimate before speaking with an accountant or adviser.

Secondary future users:

- couples with jointly held assets;
- investors using trusts;
- property investors evaluating new build versus established property;
- SMSF or high-balance super investors, if super-specific reforms are later added.

## Product Promise

Show the tax impact of a decision, not just the tax formula.

The app should translate asset records and assumptions into practical comparisons:

- current rules versus announced reform;
- sell now versus sell later;
- low, base, and high growth scenarios;
- property cash-flow impact before sale;
- total after-tax proceeds;
- top drivers of difference.

## Principles

- Source-backed: every policy assumption links to an official source or is clearly labelled as an app assumption.
- Scenario-first: the core object is a user decision, such as "sell property A in FY2028" or "hold ETF parcel until retirement".
- Transparent: users can inspect each step of the calculation.
- Conservative: where rules are not final, show uncertainty rather than overstate precision.
- Private by default: asset data should remain local unless the user explicitly opts into sync or account features.
- Designed for comparison: the user should always see old rules, new rules, and the delta.

## Success Criteria

The first useful version succeeds when a user can:

- enter a property and a share parcel;
- model a sale date before and after 1 July 2027;
- see taxable gain, estimated tax, after-tax proceeds, and difference under current versus reform settings;
- model whether a property's rental loss can offset wage income or must be carried forward;
- understand why the result changed;
- export or save a scenario summary for discussion with a tax professional.

## Non-Goals

- Lodging tax returns.
- Replacing tax, legal, or financial advice.
- Real-time brokerage or bank integrations in the first version.
- Precise ATO-compliant calculations before legislation and ATO guidance finalise the open details.
- Optimising investment recommendations such as "buy", "sell", or "hold".
