# Australian CGT Reform Research Notes

Last researched: 24 May 2026

These notes summarise the 2026-27 Australian Federal Budget capital gains tax (CGT) and negative gearing announcements that matter for an individual investor who owns residential investment property and shares.

This is product research, not tax advice. The reforms have been announced in the Budget and some implementation details are still expected to go through legislation, consultation, and ATO guidance.

## Primary Sources

- Australian Government Budget 2026-27, [Tax reform](https://budget.gov.au/content/04-tax-reform.htm)
- Australian Government Budget 2026-27 factsheet, [Negative Gearing and Capital Gains Tax Reform](https://budget.gov.au/content/factsheets/download/tax-explainers-negative-gearing-capital-gains-tax.pdf)
- Australian Government Budget Paper No. 1 2026-27, [Budget Paper No. 1](https://budget.gov.au/content/bp1/download/bp1_2026-27.pdf)
- ATO, [CGT discount](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/cgt-discount)
- ATO, [Capital gains tax](https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax)
- ATO, [Disposing of shares](https://www.ato.gov.au/individuals-and-families/investments-and-assets/investing-in-shares/disposing-of-shares)
- ATO, [Tax rates - Australian resident](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents)
- ATO, [Personal income tax - new tax cuts for every Australian taxpayer](https://www.ato.gov.au/about-ato/new-legislation/in-detail/individuals/personal-income-tax-new-tax-cuts-for-every-australian-taxpayer)
- ABS, [Consumer Price Index, Australia](https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release)

## Executive Summary

The announced reform is a combined investment tax package:

- From 1 July 2027, the 50% CGT discount for individuals, trusts, and partnerships is to be replaced by cost base indexation and a 30% minimum tax rate on real capital gains.
- The CGT reform applies only to gains accruing after 1 July 2027. Gains accrued before that date keep current treatment under transitional rules.
- Assets acquired after 1 July 2027 are wholly under the new CGT arrangements, unless an exemption applies.
- Assets already owned before 1 July 2027 and sold after that date are split into a pre-commencement component and a post-commencement component.
- The reform applies broadly to CGT assets, including property and shares, where the asset has been held for at least 12 months.
- Investors in eligible new residential builds can choose either the existing 50% CGT discount or the new indexation/minimum-tax arrangements when they sell.
- Main residence CGT exemption, small business CGT concessions, and the existing 60% qualifying affordable housing CGT discount are retained.
- From 1 July 2027, negative gearing for residential property is limited to new builds. Existing residential properties held at 7:30pm AEST on 12 May 2026 are grandfathered until sold.
- Established residential property bought after 7:30pm AEST on 12 May 2026 can still deduct rental losses against residential property income, including residential property capital gains, with excess losses carried forward.
- Commercial property and other asset classes, including shares, remain subject to existing negative gearing arrangements.

## Current CGT Baseline

Under the current rules, CGT is part of income tax. A net capital gain is included in taxable income and taxed at the taxpayer's marginal rate.

For an Australian resident individual:

- The CGT discount is generally 50% if the asset is held for at least 12 months.
- Capital losses are applied before the discount.
- Assets held for less than 12 months generally use the basic method: capital proceeds less cost base.
- Shares can trigger CGT when sold or otherwise disposed of.
- The main residence is generally exempt from CGT, subject to the detailed main residence rules.

The app should treat the current-state comparison as:

```text
nominal_gain = capital_proceeds - cost_base
current_taxable_gain = max(0, nominal_gain - capital_losses_applied)
if eligible_for_50_percent_discount:
  current_taxable_gain = current_taxable_gain * 0.5
current_tax = income_tax(non_cgt_income + current_taxable_gain) - income_tax(non_cgt_income)
```

This is a simplified estimator. A production calculator needs richer handling for ownership share, foreign residency, pre-1999 assets, main residence use, carried-forward capital losses, trust/company ownership, and small business concessions.

## Announced CGT Changes From 1 July 2027

The Budget says the Government will replace the 50% CGT discount with CPI cost base indexation and introduce a 30% minimum tax on real capital gains from 1 July 2027.

The factsheet describes the new arrangements as applying to CGT assets held by individuals, partnerships, and trusts for at least 12 months. The app should therefore treat short-term gains as a separate rule path until legislation confirms the exact interaction.

### Cost Base Indexation

The announced direction is to return to CPI indexation similar to the pre-1999 arrangement. The Budget factsheet says the ATO will provide guidance and tools.

For product design, model it as:

```text
indexed_cost_base = cost_base * cpi_at_sale / cpi_at_start
real_gain = max(0, capital_proceeds - indexed_cost_base)
```

For assets owned before 1 July 2027 and sold after 1 July 2027:

```text
pre_2027_gain = valuation_at_1_july_2027 - original_cost_base
pre_2027_taxable_gain = max(0, pre_2027_gain) * 0.5

post_2027_indexed_cost_base = valuation_at_1_july_2027 * cpi_at_sale / cpi_at_1_july_2027
post_2027_real_gain = max(0, sale_proceeds - post_2027_indexed_cost_base)

new_taxable_gain = pre_2027_taxable_gain + post_2027_real_gain
```

The Budget factsheet says taxpayers can determine the 1 July 2027 value by either:

- obtaining a valuation as at 1 July 2027, including quoted prices for assets such as shares; or
- using a specified apportionment formula based on growth rate over the holding period, with ATO tools expected.

The app should support both modes:

- "I have a 1 July 2027 value" for quoted shares, appraisals, or user-supplied property valuations.
- "Estimate from purchase and sale values" using an apportionment formula once official guidance exists.

### 30% Minimum Tax

The Budget Paper describes a 30% minimum tax on real capital gains earned from 1 July 2027. The factsheet example calculates the top-up by comparing ordinary tax on the capital gain to 30% of the gain, excluding Medicare levy.

For product design:

```text
ordinary_tax_on_real_gain = income_tax(non_cgt_income + real_gain) - income_tax(non_cgt_income)
minimum_tax_target = real_gain * 0.30
minimum_tax_top_up = max(0, minimum_tax_target - ordinary_tax_on_real_gain)
```

Open details:

- how non-refundable offsets interact with the minimum tax;
- how carried-forward capital losses interact with the minimum tax base;
- how the minimum tax applies to multi-asset disposal years;
- exact treatment of negative post-2027 real gains;
- exact CPI series and rounding rules.

The Budget Paper says income support recipients, including pensioners, will be exempt from the minimum tax. The app should include an explicit exemption input.

## Tax Rate Inputs

The calculator needs tax-year-aware individual resident tax rates because sale timing affects the user's marginal rate. ATO material confirms the 16% resident rate for the $18,201 to $45,000 bracket in 2025-26, and separate ATO legislation notes say this rate reduces to 15% from 1 July 2026 and 14% from 1 July 2027.

The app should version tax rates by income year rather than storing a single current table.

## Negative Gearing Changes

From 1 July 2027, negative gearing for residential property is limited to new builds.

For established residential properties:

- Held at 7:30pm AEST on 12 May 2026, including contracts entered but not settled: existing negative gearing rules continue until sale.
- Purchased between 7:30pm AEST on 12 May 2026 and 30 June 2027: can be negatively geared during that period, but not from 1 July 2027.
- Purchased from 1 July 2027: cannot negatively gear against non-property income.

For affected properties, net rental losses can still be:

- offset against other residential property income, including residential property capital gains; and
- carried forward to future years.

Eligible new residential builds continue to access current negative gearing treatment.

Commercial property and other asset classes, such as shares, remain subject to existing arrangements.

## Investor Impact Patterns

The app should explain impact in plain terms because the direction can differ by asset.

### High Real Return Assets

High real return assets may pay more CGT than under the 50% discount because indexation removes only inflation, not half of the full nominal gain.

This matters for:

- high-growth shares;
- high-growth investment property;
- concentrated stock positions;
- assets with long hold periods and strong nominal growth.

### Low Real Return Assets

Assets whose nominal gain mostly reflects inflation may pay less CGT because indexation can reduce the taxable gain below the old 50% discount result.

This matters for:

- low-growth property;
- defensive shares or ETFs with low price growth;
- assets held through high-inflation periods.

### Low Income Sale Years

The 30% minimum tax reduces the benefit of selling in a low-income year. It matters most when the user's marginal tax rate on non-CGT income would otherwise be below 30%.

This matters for:

- retirement-year sales;
- career breaks;
- parental leave periods;
- part-time work years;
- years with large deductions.

### Existing Property Investors

Existing properties held before 7:30pm AEST on 12 May 2026 are grandfathered for negative gearing, but post-1 July 2027 capital growth is still subject to the new CGT method when realised.

This creates two separate impacts:

- Annual cash-flow tax deductions may remain unchanged for current properties.
- Sale tax may change for gains accruing after 1 July 2027.

### Future Established Property Buyers

Future established residential property buyers face both:

- quarantined rental losses from 1 July 2027; and
- indexation/minimum-tax CGT on future real gains.

### Future New Build Buyers

Eligible new build buyers keep more favourable treatment:

- negative gearing remains available;
- on sale, they can choose between the 50% CGT discount and the new indexation/minimum-tax method.

## Product Implications

The app should not be a single "CGT calculator". It should be a scenario modelling tool with:

- a portfolio inventory of properties and share parcels;
- policy comparison across current law versus announced reform;
- sale timing analysis;
- annual negative gearing cash-flow modelling for residential property;
- CPI and tax bracket assumptions;
- uncertainty markers for rules awaiting legislation or ATO guidance;
- source-backed explanations at each calculation step.

The first version should avoid lodging or advice features. It should help the user understand magnitude, direction, and drivers of impact so they can prepare better questions for an accountant or financial adviser.

## Research Questions To Revisit

- Has legislation passed, and did it preserve the Budget factsheet details?
- What exact CPI series, dates, rounding rules, and indexation factors does the ATO prescribe?
- What official apportionment formula does the ATO provide for 1 July 2027 values?
- How do post-2027 capital losses interact with pre-2027 discounted gains?
- How does the minimum tax interact with LITO, other offsets, Medicare levy, foreign residents, and carried-forward capital losses?
- What proof is needed for an eligible new build?
- How are jointly owned assets and trusts treated in implementation detail?
