/**
 * Monte Carlo simulation utilities for validating the beta distribution
 */

import jStat from 'jstat';
import Plotly from 'plotly.js-dist-min';
import type { DistributionType } from './types';
import { generateRandomSamples, calculateCDF } from './distributions';
import { MONTE_CARLO_BETA_COLOR, PLOT_COLORS } from './constants';

/**
 * Run Monte Carlo simulation to validate beta distribution
 */
export function runMonteCarloSimulation(
  distribution: DistributionType,
  n: number,
  repetitions: number,
  orderStatistic: number,
  params?: any
): number[] {
  const percentiles: number[] = [];

  // Run simulations
  for (let r = 0; r < repetitions; r++) {
    // Generate a random sample of size n
    const sample = generateRandomSamples(distribution, n, params);

    // Get the ith order statistic (samples are already sorted)
    const value = sample[orderStatistic - 1]; // -1 for 0-indexing

    // Calculate what percentile this value represents in the true distribution
    const percentile = calculateCDF(value, distribution, params);

    // Store the percentile
    percentiles.push(percentile);
  }

  return percentiles;
}

/**
 * Render the Monte Carlo histogram with beta distribution overlay
 */
export function renderMonteCarloPlot(
  plotDiv: HTMLElement,
  percentiles: number[],
  n: number,
  orderStatistic: number,
  repetitions: number
): void {
  // Calculate beta parameters
  const a = orderStatistic;
  const b = n - orderStatistic + 1;

  // Create histogram trace with dynamic bins based on repetitions
  const histogramTrace: any = {
    x: percentiles,
    type: 'histogram',
    name: 'Simulated',
    marker: {
      color: PLOT_COLORS[0],
      opacity: 0.6,
    },
    histnorm: 'probability density',
    nbinsx: Math.min(100, Math.max(20, Math.floor(repetitions / 25))),
    hoverinfo: 'skip',
  };

  // Create beta distribution PDF trace
  const xValues = Array.from({ length: 200 }, (_, i) => i / 200);
  const yValues = xValues.map((x) => jStat.beta.pdf(x, a, b));

  const betaTrace: Partial<Plotly.PlotData> = {
    x: xValues,
    y: yValues,
    type: 'scatter',
    mode: 'lines',
    name: `Beta(${a}, ${b})`,
    line: {
      color: MONTE_CARLO_BETA_COLOR,
      width: 3,
    },
    hoverinfo: 'skip',
  };

  const layout: Partial<Plotly.Layout> = {
    title: {
      text: `Distribution of Percentiles for Order Statistic ${orderStatistic} of ${n}`,
      font: { color: '#ffffff', size: 16 },
    },
    xaxis: {
      title: { text: 'Percentile in True Distribution' },
      gridcolor: '#374151',
      color: '#9CA3AF',
      range: [0, 1],
    },
    yaxis: {
      title: { text: 'Probability Density' },
      gridcolor: '#374151',
      color: '#9CA3AF',
    },
    plot_bgcolor: '#1F2937',
    paper_bgcolor: '#1F2937',
    font: { color: '#ffffff' },
    hovermode: false,
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: 'rgba(31, 41, 55, 0.8)',
      bordercolor: '#4B5563',
      borderwidth: 1,
    },
    margin: { l: 60, r: 40, t: 60, b: 60 },
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  Plotly.newPlot(plotDiv, [histogramTrace, betaTrace], layout, config);
}
