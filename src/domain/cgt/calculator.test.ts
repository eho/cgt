import { describe, expect, it } from "vitest";
import { calculateCurrentCgt } from "./currentRules";
import { calculateNegativeGearing } from "./negativeGearing";
import { minimumTaxTopUp, calculateReformCgt } from "./reform2027";
import type { Asset, SaleScenario, TaxProfile } from "./types";

const profile: TaxProfile = {
  residency: "australian_resident",
  ownershipEntity: "individual",
  nonCgtTaxableIncome: 90_000,
  receivesIncomeSupport: false,
  carriedForwardCapitalLosses: 0,
};

const share: Asset = {
  id: "vgs",
  kind: "share_parcel",
  name: "VGS ETF",
  acquisitionDate: "2020-08-01",
  ownershipShare: 1,
  costBase: 100_000,
  currentValue: 155_000,
  valueAtPolicyStart: 160_000,
};

const scenario: SaleScenario = {
  assetId: "vgs",
  saleDate: "2028-09-01",
  saleProceeds: 190_000,
  sellingCosts: 1_000,
  cpiAtAcquisition: 110,
  cpiAtPolicyStart: 130,
  cpiAtSale: 136.5,
};

describe("CGT calculations", () => {
  it("applies current 50% discount after capital losses", () => {
    const result = calculateCurrentCgt(share, scenario, { ...profile, carriedForwardCapitalLosses: 10_000 });

    expect(result.nominalGain).toBe(89_000);
    expect(result.capitalLossesApplied).toBe(10_000);
    expect(result.taxableGain).toBe(39_500);
    expect(result.minimumTaxTopUp).toBe(0);
  });

  it("does not apply the current discount for assets held under 12 months", () => {
    const result = calculateCurrentCgt(
      { ...share, acquisitionDate: "2028-02-01" },
      scenario,
      profile,
    );

    expect(result.method).toContain("short-term");
    expect(result.taxableGain).toBe(89_000);
  });

  it("splits existing assets into pre-policy discounted gain and post-policy real gain", () => {
    const result = calculateReformCgt(share, scenario, profile);

    expect(result.method).toContain("transitional");
    expect(result.prePolicyGain).toBe(60_000);
    expect(result.prePolicyTaxableGain).toBe(30_000);
    expect(result.postPolicyRealGain).toBe(21_000);
    expect(result.taxableGain).toBe(51_000);
  });

  it("calculates post-policy indexation and minimum-tax top-up", () => {
    const postPolicyAsset = { ...share, acquisitionDate: "2027-08-01", costBase: 100_000, currentValue: 120_000 };
    const lowIncomeProfile = { ...profile, nonCgtTaxableIncome: 10_000 };
    const result = calculateReformCgt(postPolicyAsset, scenario, lowIncomeProfile);

    expect(result.indexedCostBase).toBe(124_090.91);
    expect(result.postPolicyRealGain).toBe(64_909.09);
    expect(result.minimumTaxTopUp).toBeGreaterThan(0);
  });

  it("suppresses minimum tax for income-support exemption", () => {
    expect(minimumTaxTopUp(50_000, 2_000, true)).toBe(0);
    expect(minimumTaxTopUp(50_000, 2_000, false)).toBe(13_000);
  });

  it("chooses the lower method for eligible new builds", () => {
    const newBuild: Asset = {
      ...share,
      kind: "residential_property",
      isEligibleNewBuild: true,
      acquisitionDate: "2027-08-01",
      valueAtPolicyStart: undefined,
    };
    const result = calculateReformCgt(newBuild, scenario, profile);

    expect(result.method).toContain("Eligible new build choice");
    expect(result.notes[0]).toContain("compares both allowed methods");
  });
});

describe("negative gearing", () => {
  const property: Asset = {
    id: "p1",
    kind: "residential_property",
    name: "Rental property",
    acquisitionDate: "2026-08-01",
    ownershipShare: 1,
    costBase: 700_000,
    currentValue: 780_000,
    annualRent: 34_000,
    annualInterest: 45_000,
    annualDeductibleExpenses: 8_000,
    annualDepreciation: 2_000,
  };

  it("grandfathers residential properties acquired by the announcement cut-off", () => {
    const result = calculateNegativeGearing({ ...property, acquisitionDate: "2025-01-01" }, profile);

    expect(result.status).toBe("grandfathered");
    expect(result.immediateOffset).toBe(21_000);
    expect(result.quarantinedLoss).toBe(0);
  });

  it("quarantines affected established property losses from 1 July 2027", () => {
    const result = calculateNegativeGearing(property, profile, "2027-07-01", 5_000);

    expect(result.status).toBe("quarantined");
    expect(result.immediateOffset).toBe(5_000);
    expect(result.quarantinedLoss).toBe(16_000);
  });
});
