import type { Asset, SaleScenario, TaxProfile } from "../domain/cgt/types";

export const sampleAssets: Asset[] = [
  {
    id: "property-richmond",
    kind: "residential_property",
    name: "Richmond townhouse",
    acquisitionDate: "2019-04-15",
    ownershipShare: 1,
    costBase: 820_000,
    currentValue: 1_060_000,
    valueAtPolicyStart: 1_115_000,
    isEligibleNewBuild: false,
    loanBalance: 760_000,
    interestRate: 0.072,
    annualRent: 43_000,
    annualInterest: 55_000,
    annualDeductibleExpenses: 9_500,
    annualDepreciation: 4_500,
  },
  {
    id: "shares-vgs",
    kind: "share_parcel",
    name: "VGS ETF parcel",
    acquisitionDate: "2021-09-07",
    ownershipShare: 1,
    costBase: 95_000,
    currentValue: 141_000,
    valueAtPolicyStart: 150_000,
  },
  {
    id: "property-newcastle",
    kind: "residential_property",
    name: "Newcastle new build",
    acquisitionDate: "2028-02-01",
    ownershipShare: 1,
    costBase: 690_000,
    currentValue: 710_000,
    isEligibleNewBuild: true,
    loanBalance: 600_000,
    interestRate: 0.065,
    annualRent: 37_500,
    annualInterest: 39_000,
    annualDeductibleExpenses: 7_500,
    annualDepreciation: 6_000,
  },
];

export const sampleProfile: TaxProfile = {
  residency: "australian_resident",
  ownershipEntity: "individual",
  nonCgtTaxableIncome: 150_000,
  receivesIncomeSupport: false,
  carriedForwardCapitalLosses: 12_000,
};

export const sampleScenario: SaleScenario = {
  assetId: "property-richmond",
  saleDate: "2028-09-01",
  saleProceeds: 1_220_000,
  sellingCosts: 28_000,
  cpiAtAcquisition: 112,
  cpiAtPolicyStart: 132,
  cpiAtSale: 139,
};
