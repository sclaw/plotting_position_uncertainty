/**
 * Distribution utilities for generating samples and calculating quantiles
 */

import jStat from 'jstat';
import type { DistributionType, BetaParameters } from './types';
import { DIST_PARAMS } from './constants';

/**
 * Calculate the CDF of Log-Pearson Type 3 distribution
 */
export function logPearson3CDF(
  x: number,
  mu: number = DIST_PARAMS.LP3.mu,
  sigma: number = DIST_PARAMS.LP3.sigma,
  gamma: number = DIST_PARAMS.LP3.gamma,
  base: number = DIST_PARAMS.LP3.base
): number {
  const logX = Math.log(x) / Math.log(base);
  if (gamma === 0) {
    return jStat.normal.cdf(logX, mu, sigma);
  } else {
    // For non-zero gamma, we need to use numerical approximation
    // This is a simplified approximation - for production use, consider numerical methods
    const z = (logX - mu) / sigma;
    const k = 2 / gamma;
    const alpha = k ** 2;
    const y = k + (z * gamma) / 2;

    // Using Wilson-Hilferty transformation approximation
    if (gamma > 0) {
      return jStat.normal.cdf(
        (Math.pow(y / k, 1 / 3) - (1 - 2 / (9 * alpha))) /
          Math.sqrt(2 / (9 * alpha)),
        0,
        1
      );
    } else {
      return jStat.normal.cdf(
        -(Math.pow(-y / k, 1 / 3) - (1 - 2 / (9 * alpha))) /
          Math.sqrt(2 / (9 * alpha)),
        0,
        1
      );
    }
  }
}

/**
 * Calculate the CDF (percentile) for a given value in a distribution
 */
export function calculateCDF(
  x: number,
  distribution: DistributionType,
  params?: any
): number {
  const p = params || {};

  switch (distribution) {
    case 'lp3':
      return logPearson3CDF(
        x,
        p.mu ?? DIST_PARAMS.LP3.mu,
        p.sigma ?? DIST_PARAMS.LP3.sigma,
        p.gamma ?? DIST_PARAMS.LP3.gamma,
        p.base ?? DIST_PARAMS.LP3.base
      );
    case 'weibull':
      return jStat.weibull.cdf(
        x,
        p.k ?? DIST_PARAMS.WEIBULL.k,
        p.lambda ?? DIST_PARAMS.WEIBULL.lambda
      );
    case 'pareto':
      return jStat.pareto.cdf(
        x,
        p.xm ?? DIST_PARAMS.PARETO.xm,
        p.alpha ?? DIST_PARAMS.PARETO.alpha
      );
    case 'exponential':
      return jStat.exponential.cdf(
        x,
        p.lambda ?? DIST_PARAMS.EXPONENTIAL.lambda
      );
    default:
      throw new Error(`Unknown distribution: ${distribution}`);
  }
}

/**
 * Calculate the inverse CDF of Log-Pearson Type 3 distribution
 */
export function logPearson3Inv(
  p: number,
  mu: number = DIST_PARAMS.LP3.mu,
  sigma: number = DIST_PARAMS.LP3.sigma,
  gamma: number = DIST_PARAMS.LP3.gamma,
  base: number = DIST_PARAMS.LP3.base
): number {
  if (gamma == 0) {
    return base ** jStat.normal.inv(p, mu, sigma);
  } else {
    const k = (2 / gamma) * (1 + (p * gamma) / 6 - gamma ** 2 / 36) - 2 / gamma;
    return base ** (mu + sigma * k);
  }
}

/**
 * Generate a random sample from the specified distribution
 */
export function generateRandomValue(
  distribution: DistributionType,
  u: number = Math.random(),
  params?: any
): number {
  // Use provided params or fall back to defaults
  const p = params || {};

  switch (distribution) {
    case 'lp3':
      return logPearson3Inv(
        u,
        p.mu ?? DIST_PARAMS.LP3.mu,
        p.sigma ?? DIST_PARAMS.LP3.sigma,
        p.gamma ?? DIST_PARAMS.LP3.gamma,
        p.base ?? DIST_PARAMS.LP3.base
      );
    case 'weibull':
      return jStat.weibull.inv(
        u,
        p.k ?? DIST_PARAMS.WEIBULL.k,
        p.lambda ?? DIST_PARAMS.WEIBULL.lambda
      );
    case 'pareto':
      return jStat.pareto.inv(
        u,
        p.xm ?? DIST_PARAMS.PARETO.xm,
        p.alpha ?? DIST_PARAMS.PARETO.alpha
      );
    case 'exponential':
      return jStat.exponential.inv(
        u,
        p.lambda ?? DIST_PARAMS.EXPONENTIAL.lambda
      );
    default:
      throw new Error(`Unknown distribution: ${distribution}`);
  }
}

/**
 * Generate sorted random samples from the specified distribution
 */
export function generateRandomSamples(
  distribution: DistributionType,
  n: number,
  params?: any
): number[] {
  const samples: number[] = [];

  for (let i = 0; i < n; i++) {
    samples.push(generateRandomValue(distribution, undefined, params));
  }

  return samples.sort((a, b) => a - b);
}

/**
 * Generate evenly-spaced quantile samples from the specified distribution
 */
export function generateQuantileSamples(
  distribution: DistributionType,
  n: number,
  params?: any
): number[] {
  const percentiles = Array.from({ length: n }, (_, i) => (i + 1) / (n + 1));
  return percentiles.map((p) => generateRandomValue(distribution, p, params));
}

/**
 * Calculate beta distribution parameters for a given rank and sample size
 */
export function calculateBetaParameters(
  rank: number,
  n: number
): BetaParameters {
  const betaMean = rank / (n + 1);
  const betaVar = (rank * (n - rank + 1)) / ((n + 1) ** 2 * (n + 2));
  const rhs = (betaMean * (1 - betaMean)) / betaVar - 1;
  const a = betaMean * rhs;
  const b = (1 - betaMean) * rhs;

  return { a, b };
}

/**
 * Generate true distribution values for plotting
 */
export function generateTrueDistribution(
  distribution: DistributionType,
  numPoints: number = 100,
  params?: any
): { probabilities: number[]; values: number[] } {
  const probabilities = Array.from(
    { length: numPoints },
    (_, i) => (i + 1) / (numPoints + 1)
  );
  const values = probabilities.map((p) =>
    generateRandomValue(distribution, p, params)
  );

  return { probabilities, values };
}
