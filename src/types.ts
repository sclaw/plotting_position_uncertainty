/**
 * Type definitions for the plotting position uncertainty application
 */

export type SamplingMode = 'quantile' | 'random';

export type DistributionType = 'lp3' | 'exponential' | 'weibull' | 'pareto';

export interface DistributionConfig {
  value: DistributionType;
  label: string;
  description: string;
}

export interface ConfidenceLevel {
  level: number;
  alpha: number;
}

export interface TickDefinition {
  prob?: number;
  period?: number;
  label: string;
}

export interface FilteredTick {
  val: number;
  label: string;
}

export interface AppState {
  sampleSize: number;
  selectedFormula: string;
  selectedDistribution: DistributionType;
  samplingMode: SamplingMode;
  randomSamples: number[];
}

export interface BetaParameters {
  a: number;
  b: number;
}
