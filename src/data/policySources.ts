export const policySources = [
  {
    label: "Australian Government Budget 2026-27 - Tax reform",
    url: "https://budget.gov.au/content/04-tax-reform.htm",
    note: "Primary Budget policy overview for CGT and negative gearing reform.",
  },
  {
    label: "Negative Gearing and Capital Gains Tax Reform factsheet",
    url: "https://budget.gov.au/content/factsheets/download/tax-explainers-negative-gearing-capital-gains-tax.pdf",
    note: "Design baseline for transitional gains, minimum tax, and grandfathering.",
  },
  {
    label: "ATO - Capital gains tax",
    url: "https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax",
    note: "Current CGT concepts, including asset disposal and capital losses.",
  },
  {
    label: "ATO - Tax rates, Australian residents",
    url: "https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents",
    note: "Resident individual marginal tax rate baseline used for sale-year estimates.",
  },
  {
    label: "ABS - Consumer Price Index, Australia",
    url: "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release",
    note: "CPI source reference; MVP scenarios use editable CPI assumptions.",
  },
];

export const appAssumptions = [
  "Australian resident individual tax profile only; foreign residents, trusts, companies, SMSFs, and spouse allocation are out of scope.",
  "Medicare levy, offsets, HELP, Div 293, affordable housing, main residence, small business concessions, and pre-CGT rules are not modelled.",
  "For existing assets sold after 1 July 2027, the 1 July 2027 value is user supplied or estimated from current value in the sample data.",
  "Capital losses are applied before discounts and indexation in this MVP; final reform loss ordering may change after legislation and ATO guidance.",
  "The 30% minimum-tax top-up excludes Medicare levy and is suppressed when the income-support exemption toggle is enabled.",
  "Asset data is stored only in browser localStorage for this MVP.",
];
