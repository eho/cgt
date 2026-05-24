import { calculateCurrentCgt, heldAtLeast12Months } from "./currentRules";
import { marginalTaxOnIncrease, roundMoney, taxYearForDate } from "./incomeTax";
import type { Asset, CgtCalculation, SaleScenario, TaxProfile } from "./types";
import { POLICY_START_DATE } from "./types";

export function isBeforePolicyStart(date: string): boolean {
  return date < POLICY_START_DATE;
}

export function calculateReformCgt(asset: Asset, scenario: SaleScenario, profile: TaxProfile): CgtCalculation {
  if (isBeforePolicyStart(scenario.saleDate)) {
    return {
      ...calculateCurrentCgt(asset, scenario, profile),
      method: "Reform comparison - sale before 1 July 2027 uses current rules",
      notes: ["The announced reform starts on 1 July 2027, so this sale is modelled under current CGT settings."],
    };
  }

  if (!heldAtLeast12Months(asset.acquisitionDate, scenario.saleDate)) {
    return {
      ...calculateCurrentCgt(asset, scenario, profile),
      method: "Reform comparison - short-term gain assumption",
      notes: ["Short-term gains are modelled without the 50% discount or indexation pending final legislation."],
    };
  }

  if (asset.isEligibleNewBuild && asset.kind === "residential_property") {
    return chooseNewBuildMethod(asset, scenario, profile);
  }

  if (asset.acquisitionDate < POLICY_START_DATE) {
    return calculateTransitionalReformCgt(asset, scenario, profile);
  }

  return calculatePostPolicyReformCgt(asset, scenario, profile);
}

export function calculatePostPolicyReformCgt(asset: Asset, scenario: SaleScenario, profile: TaxProfile): CgtCalculation {
  const share = asset.ownershipShare;
  const taxYear = taxYearForDate(scenario.saleDate);
  const netProceeds = roundMoney((scenario.saleProceeds - scenario.sellingCosts) * share);
  const indexedCostBase = roundMoney(asset.costBase * share * (scenario.cpiAtSale / scenario.cpiAtAcquisition));
  const realGainBeforeLosses = Math.max(0, netProceeds - indexedCostBase);
  const lossesApplied = Math.min(realGainBeforeLosses, Math.max(0, profile.carriedForwardCapitalLosses));
  const postPolicyRealGain = roundMoney(Math.max(0, realGainBeforeLosses - lossesApplied));
  const ordinaryTax = marginalTaxOnIncrease(profile.nonCgtTaxableIncome, postPolicyRealGain, taxYear);
  const topUp = minimumTaxTopUp(postPolicyRealGain, ordinaryTax, profile.receivesIncomeSupport);

  return {
    method: "Reform rules - CPI indexation plus 30% minimum tax",
    netProceeds,
    nominalGain: roundMoney(netProceeds - asset.costBase * share),
    capitalLossesApplied: roundMoney(lossesApplied),
    taxableGain: postPolicyRealGain,
    ordinaryTax,
    minimumTaxTopUp: topUp,
    totalTax: roundMoney(ordinaryTax + topUp),
    afterTaxProceeds: roundMoney(netProceeds - ordinaryTax - topUp),
    postPolicyRealGain,
    indexedCostBase,
    notes: [
      "The cost base is indexed by CPI and only the estimated real gain is included.",
      profile.receivesIncomeSupport
        ? "Minimum-tax top-up is suppressed because the profile is marked as income-support exempt."
        : "A top-up applies when ordinary income tax on the real gain is below 30%.",
    ],
  };
}

export function calculateTransitionalReformCgt(asset: Asset, scenario: SaleScenario, profile: TaxProfile): CgtCalculation {
  const share = asset.ownershipShare;
  const taxYear = taxYearForDate(scenario.saleDate);
  const netProceeds = roundMoney((scenario.saleProceeds - scenario.sellingCosts) * share);
  const originalCostBase = roundMoney(asset.costBase * share);
  const policyStartValue = roundMoney((asset.valueAtPolicyStart ?? asset.currentValue) * share);
  const prePolicyGainBeforeLosses = Math.max(0, policyStartValue - originalCostBase);
  const lossesAppliedToPre = Math.min(prePolicyGainBeforeLosses, Math.max(0, profile.carriedForwardCapitalLosses));
  const prePolicyGain = roundMoney(Math.max(0, prePolicyGainBeforeLosses - lossesAppliedToPre));
  const prePolicyTaxableGain = roundMoney(prePolicyGain * 0.5);
  const remainingLosses = Math.max(0, profile.carriedForwardCapitalLosses - lossesAppliedToPre);
  const indexedPolicyStartValue = roundMoney(policyStartValue * (scenario.cpiAtSale / scenario.cpiAtPolicyStart));
  const postPolicyRealGainBeforeLosses = Math.max(0, netProceeds - indexedPolicyStartValue);
  const lossesAppliedToPost = Math.min(postPolicyRealGainBeforeLosses, remainingLosses);
  const postPolicyRealGain = roundMoney(Math.max(0, postPolicyRealGainBeforeLosses - lossesAppliedToPost));
  const taxableGain = roundMoney(prePolicyTaxableGain + postPolicyRealGain);
  const ordinaryTax = marginalTaxOnIncrease(profile.nonCgtTaxableIncome, taxableGain, taxYear);
  const ordinaryTaxOnPostPolicyGain = marginalTaxOnIncrease(
    profile.nonCgtTaxableIncome + prePolicyTaxableGain,
    postPolicyRealGain,
    taxYear,
  );
  const minimumTax = minimumTaxTopUp(postPolicyRealGain, ordinaryTaxOnPostPolicyGain, profile.receivesIncomeSupport);

  return {
    method: "Reform rules - transitional split",
    netProceeds,
    nominalGain: roundMoney(netProceeds - originalCostBase),
    capitalLossesApplied: roundMoney(lossesAppliedToPre + lossesAppliedToPost),
    taxableGain,
    ordinaryTax,
    minimumTaxTopUp: minimumTax,
    totalTax: roundMoney(ordinaryTax + minimumTax),
    afterTaxProceeds: roundMoney(netProceeds - ordinaryTax - minimumTax),
    prePolicyGain,
    prePolicyTaxableGain,
    postPolicyRealGain,
    indexedCostBase: indexedPolicyStartValue,
    notes: [
      "Gain up to 1 July 2027 keeps the current 50% discount treatment.",
      "Post-1 July 2027 gain is estimated from the 1 July 2027 value indexed by CPI.",
      "The minimum-tax comparison allocates ordinary tax to the post-policy real gain by marginal difference.",
    ],
  };
}

export function chooseNewBuildMethod(asset: Asset, scenario: SaleScenario, profile: TaxProfile): CgtCalculation {
  const current = calculateCurrentCgt(asset, scenario, profile);
  const reform = asset.acquisitionDate < POLICY_START_DATE
    ? calculateTransitionalReformCgt({ ...asset, isEligibleNewBuild: false }, scenario, profile)
    : calculatePostPolicyReformCgt({ ...asset, isEligibleNewBuild: false }, scenario, profile);
  const chosen = current.totalTax <= reform.totalTax ? current : reform;

  return {
    ...chosen,
    method: `Eligible new build choice - ${chosen === current ? "50% discount method" : "indexation method"}`,
    notes: [
      `The calculator compares both allowed methods for eligible new builds and selects the lower tax estimate. Difference: $${Math.abs(current.totalTax - reform.totalTax).toLocaleString()}.`,
      ...chosen.notes,
    ],
  };
}

export function minimumTaxTopUp(realGain: number, ordinaryTaxOnGain: number, isExempt: boolean): number {
  if (isExempt) {
    return 0;
  }

  return roundMoney(Math.max(0, realGain * 0.3 - ordinaryTaxOnGain));
}
