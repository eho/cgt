type TaxBracket = {
  threshold: number;
  rate: number;
};

const residentBracketsByYear: Record<string, TaxBracket[]> = {
  "2025-26": [
    { threshold: 0, rate: 0 },
    { threshold: 18_200, rate: 0.16 },
    { threshold: 45_000, rate: 0.3 },
    { threshold: 135_000, rate: 0.37 },
    { threshold: 190_000, rate: 0.45 },
  ],
  "2026-27": [
    { threshold: 0, rate: 0 },
    { threshold: 18_200, rate: 0.15 },
    { threshold: 45_000, rate: 0.3 },
    { threshold: 135_000, rate: 0.37 },
    { threshold: 190_000, rate: 0.45 },
  ],
  "2027-28": [
    { threshold: 0, rate: 0 },
    { threshold: 18_200, rate: 0.14 },
    { threshold: 45_000, rate: 0.3 },
    { threshold: 135_000, rate: 0.37 },
    { threshold: 190_000, rate: 0.45 },
  ],
};

export function taxYearForDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function residentIncomeTax(income: number, taxYear = "2027-28"): number {
  const brackets = residentBracketsByYear[taxYear] ?? residentBracketsByYear["2027-28"];
  const taxableIncome = Math.max(0, income);
  let tax = 0;

  for (let index = 1; index < brackets.length; index += 1) {
    const bracket = brackets[index];
    const nextThreshold = brackets[index + 1]?.threshold ?? Number.POSITIVE_INFINITY;
    if (taxableIncome > bracket.threshold) {
      tax += (Math.min(taxableIncome, nextThreshold) - bracket.threshold) * bracket.rate;
    }
  }

  return roundMoney(tax);
}

export function marginalTaxOnIncrease(baseIncome: number, increase: number, taxYear?: string): number {
  return roundMoney(residentIncomeTax(baseIncome + Math.max(0, increase), taxYear) - residentIncomeTax(baseIncome, taxYear));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
