import type { AssetKind } from "../domain/cgt/types";

export function money(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function assetKindLabel(kind: AssetKind): string {
  return {
    residential_property: "Residential property",
    commercial_property: "Commercial property",
    share_parcel: "Share/ETF parcel",
  }[kind];
}
