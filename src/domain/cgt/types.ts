export type AssetKind = "residential_property" | "commercial_property" | "share_parcel";

export type OwnershipEntity = "individual" | "joint_individuals" | "trust" | "company" | "smsf";

export type Residency = "australian_resident" | "foreign_resident";

export type TaxProfile = {
  residency: Residency;
  ownershipEntity: OwnershipEntity;
  nonCgtTaxableIncome: number;
  receivesIncomeSupport: boolean;
  carriedForwardCapitalLosses: number;
};

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  acquisitionDate: string;
  ownershipShare: number;
  costBase: number;
  currentValue: number;
  valueAtPolicyStart?: number;
  isEligibleNewBuild?: boolean;
  loanBalance?: number;
  interestRate?: number;
  annualRent?: number;
  annualInterest?: number;
  annualDeductibleExpenses?: number;
  annualDepreciation?: number;
};

export type SaleScenario = {
  assetId: string;
  saleDate: string;
  saleProceeds: number;
  sellingCosts: number;
  cpiAtAcquisition: number;
  cpiAtPolicyStart: number;
  cpiAtSale: number;
};

export type CgtCalculation = {
  method: string;
  netProceeds: number;
  nominalGain: number;
  capitalLossesApplied: number;
  taxableGain: number;
  ordinaryTax: number;
  minimumTaxTopUp: number;
  totalTax: number;
  afterTaxProceeds: number;
  prePolicyGain?: number;
  prePolicyTaxableGain?: number;
  postPolicyRealGain?: number;
  indexedCostBase?: number;
  notes: string[];
};

export const POLICY_START_DATE = "2027-07-01";
export const GRANDFATHERING_CUTOFF_DATE = "2026-05-12";
