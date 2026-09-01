/**
 * Plotting Position Formulas
 *
 * These formulas estimate the exceedance probability for ordered data,
 * commonly used in flood frequency analysis and other hydrologic applications.
 */

export interface PlottingPositionFormula {
  name: string;
  description: string;
  calculate: (rank: number, n: number) => number;
}

export const weibull: PlottingPositionFormula = {
  name: 'Weibull',
  description:
    'P = i/(n+1) - Unbiased exceedance probabilities for all distributions',
  calculate: (m: number, n: number) => m / (n + 1),
};

export const median: PlottingPositionFormula = {
  name: 'Median',
  description:
    'P = (i-0.3175)/(n+0.365) - Median exceedance probabilities for all distributions',
  calculate: (m: number, n: number) => (m - 0.3175) / (n + 0.365),
};

export const apl: PlottingPositionFormula = {
  name: 'APL',
  description: 'P = (i-0.35)/n - Used with Probability Weighted Moments (PWMs)',
  calculate: (m: number, n: number) => (m - 0.35) / n,
};

export const blom: PlottingPositionFormula = {
  name: 'Blom',
  description: 'P = (i-3/8)/(n+1/4) - Unbiased normal quantiles',
  calculate: (m: number, n: number) => (m - 3 / 8) / (n + 1 / 4),
};

export const cunnane: PlottingPositionFormula = {
  name: 'Cunnane',
  description: 'P = (i-0.4)/(n+0.2) - Approximately quantile-unbiased',
  calculate: (m: number, n: number) => (m - 0.4) / (n + 0.2),
};

export const gringorten: PlottingPositionFormula = {
  name: 'Gringorten',
  description: 'P = (i-0.44)/(n+0.12) - Optimized for Gumbel distribution',
  calculate: (m: number, n: number) => (m - 0.44) / (n + 0.12),
};

export const hazen: PlottingPositionFormula = {
  name: 'Hazen',
  description: 'P = (i-0.5)/n - A traditional choice',
  calculate: (m: number, n: number) => (m - 0.5) / n,
};

export const allFormulas: PlottingPositionFormula[] = [
  weibull,
  median,
  apl,
  blom,
  cunnane,
  gringorten,
  hazen,
];
