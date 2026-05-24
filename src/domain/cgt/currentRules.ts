import { marginalTaxOnIncrease, roundMoney, taxYearForDate } from "./incomeTax";
import type { Asset, CgtCalculation, SaleScenario, TaxProfile } from "./types";

const DAYS_IN_YEAR = 365.25;

export function heldAtLeast12Months(acquisitionDate: string, saleDate: string): boolean {
  const acquired = new Date(`${acquisitionDate}T00:00:00`).getTime();
  const sold = new Date(`${saleDate}T00:00:00`).getTime();
  return (sold - acquired) / (1000 * 60 * 60 * 24) >= DAYS_IN_YEAR;
}

export function calculateCurrentCgt(asset: Asset, scenario: SaleScenario, profile: TaxProfile): CgtCalculation {
  const share = asset.ownershipShare;
  const taxYear = taxYearForDate(scenario.saleDate);
  const netProceeds = roundMoney((scenario.saleProceeds - scenario.sellingCosts) * share);
  const costBase = roundMoney(asset.costBase * share);
  const nominalGain = roundMoney(netProceeds - costBase);
  const lossesApplied = Math.min(Math.max(0, nominalGain), Math.max(0, profile.carriedForwardCapitalLosses));
  const gainAfterLosses = Math.max(0, nominalGain - lossesApplied);
  const discountEligible = heldAtLeast12Months(asset.acquisitionDate, scenario.saleDate);
  const taxableGain = roundMoney(discountEligible ? gainAfterLosses * 0.5 : gainAfterLosses);
  const ordinaryTax = marginalTaxOnIncrease(profile.nonCgtTaxableIncome, taxableGain, taxYear);

  return {
    method: discountEligible ? "Current rules - 50% discount" : "Current rules - short-term gain",
    netProceeds,
    nominalGain,
    capitalLossesApplied: roundMoney(lossesApplied),
    taxableGain,
    ordinaryTax,
    minimumTaxTopUp: 0,
    totalTax: ordinaryTax,
    afterTaxProceeds: roundMoney(netProceeds - ordinaryTax),
    notes: [
      discountEligible
        ? "Capital losses are applied before the 50% individual CGT discount."
        : "Held for less than 12 months, so the 50% CGT discount is not applied.",
    ],
  };
}
