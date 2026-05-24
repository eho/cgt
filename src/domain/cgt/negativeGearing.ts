import { marginalTaxOnIncrease, roundMoney } from "./incomeTax";
import type { Asset, TaxProfile } from "./types";
import { GRANDFATHERING_CUTOFF_DATE, POLICY_START_DATE } from "./types";

export type NegativeGearingResult = {
  status: "grandfathered" | "new_build_allowed" | "quarantined" | "not_residential" | "positive_or_neutral";
  netRentalResult: number;
  immediateOffset: number;
  quarantinedLoss: number;
  taxBenefit: number;
  explanation: string;
};

export function calculateNegativeGearing(
  asset: Asset,
  profile: TaxProfile,
  taxYearStartDate = POLICY_START_DATE,
  residentialPropertyIncome = 0,
): NegativeGearingResult {
  if (asset.kind !== "residential_property") {
    return {
      status: "not_residential",
      netRentalResult: 0,
      immediateOffset: 0,
      quarantinedLoss: 0,
      taxBenefit: 0,
      explanation: "Negative gearing reform applies to residential property; this asset keeps existing treatment.",
    };
  }

  const annualInterest = asset.annualInterest ?? (asset.loanBalance ?? 0) * (asset.interestRate ?? 0);
  const netRentalResult = roundMoney(
    (asset.annualRent ?? 0) -
      annualInterest -
      (asset.annualDeductibleExpenses ?? 0) -
      (asset.annualDepreciation ?? 0),
  );

  if (netRentalResult >= 0) {
    return {
      status: "positive_or_neutral",
      netRentalResult,
      immediateOffset: 0,
      quarantinedLoss: 0,
      taxBenefit: 0,
      explanation: "The property is not negatively geared in this scenario.",
    };
  }

  const loss = Math.abs(netRentalResult);
  const canOffsetIncome =
    asset.isEligibleNewBuild ||
    asset.acquisitionDate <= GRANDFATHERING_CUTOFF_DATE ||
    taxYearStartDate < POLICY_START_DATE;

  if (canOffsetIncome) {
    const taxBenefit = marginalTaxOnIncrease(Math.max(0, profile.nonCgtTaxableIncome - loss), loss);
    return {
      status: asset.isEligibleNewBuild ? "new_build_allowed" : "grandfathered",
      netRentalResult,
      immediateOffset: loss,
      quarantinedLoss: 0,
      taxBenefit,
      explanation: asset.isEligibleNewBuild
        ? "Eligible new residential builds continue to access current negative gearing treatment."
        : "Residential properties held before the 12 May 2026 cut-off are modelled as grandfathered until sale.",
    };
  }

  const immediateOffset = Math.min(loss, Math.max(0, residentialPropertyIncome));
  const quarantinedLoss = roundMoney(loss - immediateOffset);

  return {
    status: "quarantined",
    netRentalResult,
    immediateOffset,
    quarantinedLoss,
    taxBenefit: 0,
    explanation: "From 1 July 2027, losses on affected established residential property are quarantined after residential property income offsets.",
  };
}
