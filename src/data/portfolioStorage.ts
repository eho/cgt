import type { Asset, SaleScenario, TaxProfile } from "../domain/cgt/types";
import { sampleAssets, sampleProfile, sampleScenario } from "./samplePortfolio";

export type PortfolioState = {
  assets: Asset[];
  profile: TaxProfile;
  scenario: SaleScenario;
};

const storageKey = "cgt-impact-calculator-state-v1";

export function loadPortfolioState(): PortfolioState {
  if (typeof window === "undefined") {
    return getDefaultPortfolioState();
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return getDefaultPortfolioState();
  }

  try {
    return JSON.parse(raw) as PortfolioState;
  } catch {
    return getDefaultPortfolioState();
  }
}

export function savePortfolioState(state: PortfolioState): void {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearPortfolioState(): PortfolioState {
  window.localStorage.removeItem(storageKey);
  return getDefaultPortfolioState();
}

export function getDefaultPortfolioState(): PortfolioState {
  return {
    assets: sampleAssets,
    profile: sampleProfile,
    scenario: sampleScenario,
  };
}
