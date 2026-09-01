/**
 * Application constants
 */

import type {
  DistributionConfig,
  ConfidenceLevel,
  TickDefinition,
} from './types';

// Color scheme for plots
export const PLOT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#dbec48',
] as const;

export const BETA_COLOR = '#3b82f6';
export const MONTE_CARLO_BETA_COLOR = '#a855f7';
export const TRUE_DIST_COLOR = '#ef4444';

// Confidence levels for beta distribution uncertainty bands
export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  { level: 0.95, alpha: 0.15 },
  { level: 0.9, alpha: 0.25 },
  { level: 0.5, alpha: 0.35 },
];

// Distribution configurations
export const DISTRIBUTIONS: DistributionConfig[] = [
  {
    value: 'lp3',
    label: 'Log-Pearson Type 3',
    description: 'Log-Pearson Type 3 (μ=2, σ=5, γ=0.5)',
  },
  {
    value: 'exponential',
    label: 'Exponential',
    description: 'Exponential distribution (λ=5)',
  },
  {
    value: 'weibull',
    label: 'Weibull',
    description: 'Weibull distribution (k=2, λ=5)',
  },
  {
    value: 'pareto',
    label: 'Pareto',
    description: 'Pareto distribution (xₘ=1, α=2)',
  },
];

// Distribution parameters
export const DIST_PARAMS = {
  LP3: { mu: 2, sigma: 5, gamma: 0.5, base: 10 },
  EXPONENTIAL: { lambda: 5 },
  WEIBULL: { k: 2, lambda: 5 },
  PARETO: { xm: 1, alpha: 2 },
} as const;

// Axis tick definitions
export const AEP_TICKS: TickDefinition[] = [
  { prob: 0.99, label: '0.99' },
  { prob: 0.9, label: '0.9' },
  { prob: 0.5, label: '0.5' },
  { prob: 0.2, label: '0.2' },
  { prob: 0.1, label: '0.1' },
  { prob: 0.02, label: '0.02' },
  { prob: 0.005, label: '0.005' },
  { prob: 0.0001, label: '0.0001' },
];

export const RETURN_PERIOD_TICKS: TickDefinition[] = [
  { period: 1.1, label: '1.1' },
  { period: 2, label: '2' },
  { period: 5, label: '5' },
  { period: 10, label: '10' },
  { period: 50, label: '50' },
  { period: 200, label: '200' },
  { period: 1000, label: '1000' },
];

// Default values
export const DEFAULT_FORMULA = 'Weibull';
export const DEFAULT_DISTRIBUTION: DistributionConfig['value'] = 'exponential';
export const DEFAULT_SAMPLING_MODE = 'random';
