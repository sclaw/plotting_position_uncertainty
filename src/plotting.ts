/**
 * Plotting and chart generation utilities
 */

import Plotly from 'plotly.js-dist-min';
import jStat from 'jstat';
import type { DistributionType, FilteredTick } from './types';
import { allFormulas } from './plottingPositions';
import {
  PLOT_COLORS,
  BETA_COLOR,
  TRUE_DIST_COLOR,
  CONFIDENCE_LEVELS,
  AEP_TICKS,
  RETURN_PERIOD_TICKS,
} from './constants';
import {
  calculateBetaParameters,
  generateTrueDistribution,
} from './distributions';

/**
 * Convert RGB hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Filter ticks to only show those within the data range
 */
function filterTicksByRange(
  ticks: { val: number; label: string }[],
  minX: number,
  maxX: number
): FilteredTick[] {
  return ticks.filter((tick) => tick.val >= minX && tick.val <= maxX);
}

/**
 * Create confidence band traces for beta distribution uncertainty
 */
function createConfidenceBands(
  ranks: number[],
  rvs: number[],
  n: number
): Partial<Plotly.PlotData>[] {
  const traces: Partial<Plotly.PlotData>[] = [];

  CONFIDENCE_LEVELS.forEach(({ level, alpha }) => {
    const lowerProb = (1 - level) / 2;
    const upperProb = 1 - lowerProb;

    const lowerBand = ranks.map((m) => {
      const { a, b } = calculateBetaParameters(m, n);
      return jStat.beta.inv(lowerProb, a, b);
    });

    const upperBand = ranks.map((m) => {
      const { a, b } = calculateBetaParameters(m, n);
      return jStat.beta.inv(upperProb, a, b);
    });

    // Lower bound trace
    traces.push({
      x: lowerBand.map((p) => jStat.normal.inv(p, 0, 1)),
      y: rvs,
      mode: 'lines',
      line: { width: 0 },
      showlegend: false,
      hoverinfo: 'skip',
      name: 'Full Beta distribution uncertainty',
    });

    // Upper bound trace (fills to previous)
    traces.push({
      x: upperBand.map((p) => jStat.normal.inv(p, 0, 1)),
      y: rvs,
      mode: 'lines',
      line: { width: 0 },
      fill: 'tonexty',
      fillcolor: hexToRgba(BETA_COLOR, alpha),
      showlegend: true,
      hoverinfo: 'skip',
      name: `${Math.round(level * 100)}% confidence`,
    });
  });

  return traces;
}

/**
 * Create true distribution trace
 */
function createTrueDistributionTrace(
  distribution: DistributionType,
  params?: any
): Partial<Plotly.PlotData> {
  const { probabilities, values } = generateTrueDistribution(
    distribution,
    100,
    params
  );

  return {
    x: probabilities.map((p) => jStat.normal.inv(p, 0, 1)),
    y: values,
    mode: 'lines',
    name: 'True Distribution',
    line: {
      width: 2,
      color: TRUE_DIST_COLOR,
      dash: 'solid',
    },
    showlegend: true,
  };
}

/**
 * Create plotting position traces for selected formulas
 */
function createPlottingPositionTraces(
  selectedFormula: string,
  ranks: number[],
  rvs: number[],
  n: number
): Partial<Plotly.PlotData>[] {
  return allFormulas
    .filter((formula) => formula.name === selectedFormula)
    .map((formula, idx) => {
      const color = PLOT_COLORS[idx % PLOT_COLORS.length];

      return {
        x: ranks
          .map((m) => formula.calculate(m, n))
          .map((p) => jStat.normal.inv(p, 0, 1)),
        y: rvs,
        mode: 'markers',
        name: formula.name,
        marker: {
          size: 6,
          color: color,
          line: { width: 1, color: '#000000' },
        },
        line: { width: 2, color: color },
      };
    });
}

/**
 * Create dummy trace for secondary x-axis visibility
 */
function createDummyTrace(
  minX: number,
  maxX: number,
  firstYValue: number
): Partial<Plotly.PlotData> {
  return {
    x: [minX, maxX],
    y: [firstYValue, firstYValue],
    xaxis: 'x2',
    mode: 'markers',
    marker: { size: 0, opacity: 0 },
    showlegend: false,
    hoverinfo: 'skip',
  };
}

/**
 * Calculate axis ticks based on data range
 */
function calculateAxisTicks(allXValues: number[]): {
  aepTicks: FilteredTick[];
  returnPeriodTicks: FilteredTick[];
} {
  const minX = Math.min(...allXValues);
  const maxX = Math.max(...allXValues);

  const aepTicksConverted = AEP_TICKS.map((tick) => ({
    val: jStat.normal.inv(1 - tick.prob!, 0, 1),
    label: tick.label,
  }));

  const returnPeriodTicksConverted = RETURN_PERIOD_TICKS.map((tick) => ({
    val: jStat.normal.inv(1 - 1 / tick.period!, 0, 1),
    label: tick.label,
  }));

  return {
    aepTicks: filterTicksByRange(aepTicksConverted, minX, maxX),
    returnPeriodTicks: filterTicksByRange(
      returnPeriodTicksConverted,
      minX,
      maxX
    ),
  };
}

/**
 * Create plot layout configuration
 */
function createPlotLayout(
  aepTicks: FilteredTick[],
  returnPeriodTicks: FilteredTick[]
): Partial<Plotly.Layout> {
  return {
    title: {
      text: 'Plotting Positions with Confidence Bounds',
      font: {
        size: 18,
        color: '#f3f4f6',
      },
    },
    xaxis: {
      title: { text: 'Annual Exceedance Probability' },
      gridcolor: '#374151',
      color: '#d1d5db',
      tickmode: 'array',
      tickvals: aepTicks.map((t) => t.val),
      ticktext: aepTicks.map((t) => t.label),
    },
    xaxis2: {
      title: {
        text: 'Return Period (years)',
        font: { color: '#d1d5db' },
      },
      tickfont: { color: '#d1d5db' },
      overlaying: 'x',
      side: 'top',
      tickmode: 'array',
      tickvals: returnPeriodTicks.map((t) => t.val),
      ticktext: returnPeriodTicks.map((t) => t.label),
      showgrid: false,
      scaleanchor: 'x',
    },
    yaxis: {
      title: { text: 'Value' },
      gridcolor: '#374151',
      color: '#d1d5db',
      type: 'log',
    },
    plot_bgcolor: '#1f2937',
    paper_bgcolor: '#1f2937',
    margin: { t: 130, r: 20, b: 60, l: 60 },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(31, 41, 55, 0.8)',
      bordercolor: '#4b5563',
      borderwidth: 1,
      font: { color: '#f3f4f6' },
    },
  };
}

/**
 * Generate and render the main plot
 */
export function renderPlot(
  plotDiv: HTMLElement,
  rvs: number[],
  selectedFormula: string,
  selectedDistribution: DistributionType,
  params?: any
): void {
  const n = rvs.length;
  const ranks = Array.from({ length: n }, (_, i) => i + 1);

  // Build all traces
  const traces: Partial<Plotly.PlotData>[] = [];

  // Add confidence bands
  traces.push(...createConfidenceBands(ranks, rvs, n));

  // Add true distribution
  traces.push(createTrueDistributionTrace(selectedDistribution, params));

  // Add plotting position formulas
  traces.push(...createPlottingPositionTraces(selectedFormula, ranks, rvs, n));

  // Calculate data range for axis ticks
  const allXValues = traces.flatMap((trace) => (trace.x as number[]) || []);
  const { aepTicks, returnPeriodTicks } = calculateAxisTicks(allXValues);

  // Add dummy trace for secondary x-axis
  const minX = Math.min(...allXValues);
  const maxX = Math.max(...allXValues);
  traces.push(createDummyTrace(minX, maxX, rvs[0]));

  // Create layout
  const layout = createPlotLayout(aepTicks, returnPeriodTicks);

  // Create config
  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d',
      'select2d',
    ] as Plotly.ModeBarDefaultButtons[],
  };

  // Render the plot
  Plotly.newPlot(plotDiv, traces, layout, config);
}
