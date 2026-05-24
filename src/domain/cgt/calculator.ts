import { calculateCurrentCgt } from "./currentRules";
import { calculateNegativeGearing } from "./negativeGearing";
import { calculateReformCgt } from "./reform2027";
import type { Asset, SaleScenario, TaxProfile } from "./types";

export function compareAssetScenario(asset: Asset, scenario: SaleScenario, profile: TaxProfile) {
  const current = calculateCurrentCgt(asset, scenario, profile);
  const reform = calculateReformCgt(asset, scenario, profile);
  const negativeGearing = calculateNegativeGearing(asset, profile);

  return {
    current,
    reform,
    negativeGearing,
    taxDelta: reform.totalTax - current.totalTax,
    proceedsDelta: reform.afterTaxProceeds - current.afterTaxProceeds,
  };
}
