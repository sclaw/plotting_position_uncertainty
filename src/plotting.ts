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
  DIST_PARAMS,
} from './constants';
import {
  calculateBetaParameters,
  generateTrueDistribution,
  logPearson3Inv,
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
      xaxis: 'x',
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
      xaxis: 'x',
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
    xaxis: 'x',
    mode: 'lines',
    name: 'True Distribution',
    line: {
      width: 2,
      color: TRUE_DIST_COLOR,
      dash: 'solid',
    },
    showlegend: true,
    hoverinfo: 'skip',
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
        xaxis: 'x',
        mode: 'markers',
        name: formula.name,
        marker: {
          size: 6,
          color: color,
          line: { width: 1, color: '#000000' },
        },
        line: { width: 2, color: color },
        hoverinfo: 'skip',
      };
    });
}

/**
 * Calculate the CDF (exceedance probability) for a value in the true distribution
 */
function calculateTrueCDF(
  value: number,
  distribution: DistributionType,
  params?: any
): number {
  const p = params || {};

  switch (distribution) {
    case 'exponential':
      const lambda = p.lambda ?? DIST_PARAMS.EXPONENTIAL.lambda;
      return (jStat.exponential as any).cdf(value, lambda);
    case 'weibull':
      const k = p.k ?? DIST_PARAMS.WEIBULL.k;
      const wLambda = p.lambda ?? DIST_PARAMS.WEIBULL.lambda;
      return (jStat.weibull as any).cdf(value, k, wLambda);
    case 'pareto':
      const xm = p.xm ?? DIST_PARAMS.PARETO.xm;
      const alpha = p.alpha ?? DIST_PARAMS.PARETO.alpha;
      return 1 - (jStat.pareto as any).cdf(value, xm, alpha);
    case 'lp3':
      // For LP3, use binary search to find the probability
      const mu = p.mu ?? DIST_PARAMS.LP3.mu;
      const sigma = p.sigma ?? DIST_PARAMS.LP3.sigma;
      const gamma = p.gamma ?? DIST_PARAMS.LP3.gamma;
      const base = p.base ?? DIST_PARAMS.LP3.base;

      let low = 0.0001;
      let high = 0.9999;
      let mid: number;
      const tolerance = 0.0001;

      for (let i = 0; i < 50; i++) {
        mid = (low + high) / 2;
        const testValue = logPearson3Inv(mid, mu, sigma, gamma, base);
        if (Math.abs(testValue - value) < tolerance) {
          return 1 - mid;
        }
        if (testValue < value) {
          low = mid;
        } else {
          high = mid;
        }
      }
      return 1 - (low + high) / 2;
    default:
      return 0.5;
  }
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
    yaxis: 'y',
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
  // Responsive margins based on screen size
  const isMobile = window.innerWidth < 640;
  const leftMargin = isMobile ? 50 : 120;
  const topMargin = isMobile ? 100 : 130;
  const rightMargin = isMobile ? 10 : 20;
  const bottomMargin = isMobile ? 50 : 60;
  const titleSize = isMobile ? 14 : 18;

  return {
    title: {
      text: 'Plotting Positions with Confidence Bounds',
      font: {
        size: titleSize,
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
      domain: [0, 1],
      anchor: 'y',
      side: 'bottom',
      showgrid: true,
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
    xaxis3: {
      title: { text: 'Annual Exceedance Probability' },
      gridcolor: '#374151',
      color: '#d1d5db',
      tickmode: 'array',
      tickvals: aepTicks.map((t) => t.val),
      ticktext: aepTicks.map((t) => t.label),
      domain: [0, 1],
      anchor: 'y3',
      side: 'bottom',
      showgrid: false,
      matches: 'x',
    },
    yaxis: {
      title: { text: 'Value' },
      gridcolor: '#374151',
      color: '#d1d5db',
      type: 'log',
      domain: [0.33, 1],
      anchor: 'x',
    },
    yaxis3: {
      title: {
        text: '',
        standoff: 0,
      },
      tickmode: 'array',
      tickvals: [0, 1],
      ticktext: ['True AEP', 'Plotting Position'],
      tickfont: { size: 11, color: '#d1d5db' },
      domain: [0, 0.16],
      anchor: 'x3',
      range: [-0.5, 1.5],
      showgrid: false,
    },
    plot_bgcolor: '#1f2937',
    paper_bgcolor: '#1f2937',
    margin: { t: topMargin, r: rightMargin, b: bottomMargin, l: leftMargin },
    hovermode: false,
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
  const formula = allFormulas.find((f) => f.name === selectedFormula);

  // Build main plot traces
  const traces: Partial<Plotly.PlotData>[] = [];

  // Add confidence bands
  traces.push(...createConfidenceBands(ranks, rvs, n));

  // Add true distribution
  traces.push(createTrueDistributionTrace(selectedDistribution, params));

  // Add plotting position formulas
  traces.push(...createPlottingPositionTraces(selectedFormula, ranks, rvs, n));

  // Calculate data range for axis ticks
  const allXValues = traces.flatMap((trace) => (trace.x as number[]) || []);

  // Add rug plot traces if formula is available
  if (formula) {
    // Calculate plotting position AEPs
    const plottingAEPs = ranks.map((m) => formula.calculate(m, n));
    const plottingX = plottingAEPs.map((p) => jStat.normal.inv(p, 0, 1));

    // Calculate true distribution AEPs
    const trueAEPs = rvs.map((value) =>
      calculateTrueCDF(value, selectedDistribution, params)
    );
    const trueX = trueAEPs.map((p) => jStat.normal.inv(p, 0, 1));

    // Add to all x values for axis calculation
    allXValues.push(...plottingX, ...trueX);

    // Add rug plot traces (on yaxis3)
    traces.push({
      x: plottingX,
      y: Array(n).fill(1),
      yaxis: 'y3',
      mode: 'markers',
      name: 'Plotting Position AEP',
      marker: {
        symbol: 'line-ns-open',
        size: 14,
        color: '#3b82f6',
        line: { width: 2, color: '#3b82f6' },
      },
      showlegend: false,
      hoverinfo: 'skip',
    });

    traces.push({
      x: trueX,
      y: Array(n).fill(0),
      yaxis: 'y3',
      mode: 'markers',
      name: 'True Distribution AEP',
      marker: {
        symbol: 'line-ns-open',
        size: 14,
        color: TRUE_DIST_COLOR,
        line: { width: 2, color: TRUE_DIST_COLOR },
      },
      showlegend: false,
      hoverinfo: 'skip',
    });
  }

  const { aepTicks, returnPeriodTicks } = calculateAxisTicks(allXValues);

  // Add dummy trace for secondary x-axis
  const minX = Math.min(...allXValues);
  const maxX = Math.max(...allXValues);
  traces.push(createDummyTrace(minX, maxX, rvs[0]));

  // Create layout
  const layout = createPlotLayout(aepTicks, returnPeriodTicks);

  // Create config
  const isMobile = window.innerWidth < 640;
  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: isMobile ? 'hover' : true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'lasso2d',
      'select2d',
    ] as Plotly.ModeBarDefaultButtons[],
  };

  // Render the plot
  Plotly.newPlot(plotDiv, traces, layout, config);
}
