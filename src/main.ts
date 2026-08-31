import './style.css';
import './math';
import Plotly from 'plotly.js-dist-min';
import { allFormulas } from './plottingPositions';
import jStat from 'jstat';

// DOM Elements
let plotDiv: HTMLElement;
let sampleSizeInput: HTMLInputElement;
let selectedFormulas: Set<string> = new Set(['Weibull']);
let selectedDistribution: string = 'exponential';
let samplingMode: 'quantile' | 'random' = 'quantile';
let randomSamples: number[] = [];

/**
 * Initialize the application
 */
function init() {
  // Get DOM references
  plotDiv = document.getElementById('plot')!;
  sampleSizeInput = document.getElementById('sample-size') as HTMLInputElement;

  // Setup event listeners
  setupEventListeners();

  // Create formula checkboxes
  createFormulaSelector();

  // Create distribution selector
  createDistributionSelector();

  // Setup sampling mode toggle
  setupSamplingModeToggle();

  // Initial plot
  updatePlot();
}

/**
 * Create dropdown selector for distributions
 */
function createDistributionSelector() {
  const container = document.getElementById('distribution-selector')!;

  const distributions = [
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

  distributions.forEach((dist) => {
    const option = document.createElement('label');
    option.className =
      'flex items-start px-4 py-3 hover:bg-gray-600 cursor-pointer transition-colors border-b border-gray-600 last:border-b-0';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'distribution';
    radio.value = dist.value;
    radio.checked = dist.value === selectedDistribution;
    radio.className =
      'mt-1 mr-3 w-4 h-4 text-blue-500 bg-gray-800 border-gray-500 focus:ring-blue-500 focus:ring-2 cursor-pointer';
    radio.addEventListener('change', handleDistributionChange);

    const textContainer = document.createElement('div');
    textContainer.className = 'flex-1';

    const title = document.createElement('div');
    title.className = 'text-white font-medium';
    title.textContent = dist.label;

    const subtitle = document.createElement('div');
    subtitle.className = 'text-gray-400 text-sm mt-0.5';
    subtitle.textContent = dist.description;

    textContainer.appendChild(title);
    textContainer.appendChild(subtitle);

    option.appendChild(radio);
    option.appendChild(textContainer);
    container.appendChild(option);
  });
}

/**
 * Handle distribution change
 */
function handleDistributionChange(event: Event) {
  selectedDistribution = (event.target as HTMLInputElement).value;
  updatePlot();
}

/**
 * Setup sampling mode toggle
 */
function setupSamplingModeToggle() {
  const toggle = document.getElementById(
    'sampling-mode-toggle'
  ) as HTMLInputElement;
  const randomizeBtn = document.getElementById('randomize-btn')!;

  toggle.addEventListener('change', (e) => {
    samplingMode = (e.target as HTMLInputElement).checked
      ? 'random'
      : 'quantile';

    // Show/hide randomize button
    if (samplingMode === 'random') {
      randomizeBtn.classList.remove('hidden');
      generateRandomSamples();
    } else {
      randomizeBtn.classList.add('hidden');
    }

    updatePlot();
  });

  randomizeBtn.addEventListener('click', () => {
    generateRandomSamples();
    updatePlot();
  });
}

/**
 * Generate random samples from the selected distribution
 */
function generateRandomSamples() {
  const n = parseInt(sampleSizeInput.value);
  randomSamples = [];

  for (let i = 0; i < n; i++) {
    const u = Math.random();
    let value: number;

    switch (selectedDistribution) {
      case 'lp3':
        value = log_pearson_3_inv(u, 2, 5, 0.5);
        break;
      case 'weibull':
        value = jStat.weibull.inv(u, 2, 5);
        break;
      case 'pareto':
        value = jStat.pareto.inv(u, 1, 2);
        break;
      case 'exponential':
      default:
        value = jStat.exponential.inv(u, 5);
        break;
    }

    randomSamples.push(value);
  }

  // Sort the samples
  randomSamples.sort((a, b) => a - b);
}

/**
 * Create dropdown selector for formulas
 */
function createFormulaSelector() {
  const container = document.getElementById('formula-selector')!;

  // Create dropdown button
  const button = document.createElement('button');
  button.id = 'formula-dropdown-button';
  button.type = 'button';
  button.className =
    'w-full flex items-center justify-between px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-650 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
  button.innerHTML = `
    <span id="formula-selected-count">1 formula selected</span>
    <svg class="w-5 h-5 transition-transform" id="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  `;

  // Create dropdown menu
  const menu = document.createElement('div');
  menu.id = 'formula-dropdown-menu';
  menu.className =
    'absolute z-10 w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-96 overflow-y-auto hidden';

  // Create options
  allFormulas.forEach((formula) => {
    const option = document.createElement('label');
    option.className =
      'flex items-start px-4 py-3 hover:bg-gray-600 cursor-pointer transition-colors border-b border-gray-600 last:border-b-0';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = formula.name;
    checkbox.checked = formula.name === 'Weibull';
    checkbox.className =
      'mt-1 mr-3 w-4 h-4 text-blue-500 bg-gray-800 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer';
    checkbox.addEventListener('change', handleFormulaToggle);

    const textContainer = document.createElement('div');
    textContainer.className = 'flex-1';

    const title = document.createElement('div');
    title.className = 'text-white font-medium';
    title.textContent = formula.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'text-gray-400 text-sm mt-0.5';
    subtitle.textContent = formula.description;

    textContainer.appendChild(title);
    textContainer.appendChild(subtitle);

    option.appendChild(checkbox);
    option.appendChild(textContainer);
    menu.appendChild(option);
  });

  container.appendChild(button);
  container.appendChild(menu);

  // Toggle dropdown
  button.addEventListener('click', () => {
    const isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    const arrow = document.getElementById('dropdown-arrow')!;
    arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      menu.classList.add('hidden');
      const arrow = document.getElementById('dropdown-arrow')!;
      arrow.style.transform = 'rotate(0deg)';
    }
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  sampleSizeInput.addEventListener('input', handleSampleSizeChange);

  // Increment/decrement buttons
  const decreaseBtn = document.getElementById('decrease-sample-size')!;
  const increaseBtn = document.getElementById('increase-sample-size')!;

  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(sampleSizeInput.value);
    const minValue = parseInt(sampleSizeInput.min);
    if (currentValue > minValue) {
      sampleSizeInput.value = Math.floor(currentValue / 2).toString();
      handleSampleSizeChange({ target: sampleSizeInput } as any);
    }
  });

  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(sampleSizeInput.value);
    const maxValue = parseInt(sampleSizeInput.max);
    if (currentValue < maxValue) {
      sampleSizeInput.value = (currentValue * 2).toString();
      handleSampleSizeChange({ target: sampleSizeInput } as any);
    }
  });
}

/**
 * Handle sample size change
 */
function handleSampleSizeChange(_event: Event) {
  updatePlot();
}

/**
 * Handle formula selector change
 */
function handleFormulaToggle() {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '#formula-dropdown-menu input[type="checkbox"]'
  );
  selectedFormulas.clear();

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedFormulas.add(checkbox.value);
    }
  });

  // Update selected count
  const countElement = document.getElementById('formula-selected-count')!;
  const count = selectedFormulas.size;
  countElement.textContent =
    count === 1 ? '1 formula selected' : `${count} formulas selected`;

  updatePlot();
}

function log_pearson_3_inv(
  p: number,
  mu: number,
  sigma: number,
  gamma: number,
  base: number = 10
): number {
  const k = (2 / gamma) * (1 + (p * gamma) / 6 - gamma ** 2 / 36) - 2 / gamma;
  return base ** (mu + sigma * k);
}

/**
 * Update the plot with current settings
 */
function updatePlot() {
  // TODO: refactor this messy func
  // TODO: hovering on points on the plot should show AEP not standard normal z score
  // TODO: allow user to adjust distribution parameters
  // TODO: add normal distribution
  // TODO: support other plotting paper?
  // TODO: Add some sort of record of how often true dist was within beta x percent CI
  // TODO: Add some sort of visualization or interactive plot for the binomial experiment analogy
  const n = parseInt(sampleSizeInput.value);

  // Get samples based on sampling mode
  let rvs: number[];

  if (samplingMode === 'random') {
    // Use random samples (regenerate if needed)
    if (randomSamples.length !== n) {
      generateRandomSamples();
    }
    rvs = randomSamples;
  } else {
    // Use evenly spaced quantiles
    const percentiles = Array.from({ length: n }, (_, i) => (i + 1) / (n + 1));
    switch (selectedDistribution) {
      case 'lp3':
        rvs = percentiles.map((p) => log_pearson_3_inv(p, 2, 5, 0.5));
        break;
      case 'weibull':
        rvs = percentiles.map((p) => jStat.weibull.inv(p, 2, 5));
        break;
      case 'pareto':
        rvs = percentiles.map((p) => jStat.pareto.inv(p, 1, 2));
        break;
      case 'exponential':
      default:
        rvs = percentiles.map((p) => jStat.exponential.inv(p, 5));
        break;
    }
  }

  const ranks = Array.from({ length: n }, (_, i) => i + 1);

  // Create traces for each selected formula and beta dist
  const traces: any[] = [];
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#dbec48',
  ];
  const beta_color = '#3b82f6';

  // Create traces for beta distribution uncertainty
  const confidenceLevels = [
    { level: 0.95, alpha: 0.15 },
    { level: 0.9, alpha: 0.25 },
    { level: 0.5, alpha: 0.35 },
  ];

  // Add confidence bands (from widest to narrowest)
  confidenceLevels.forEach(({ level, alpha }) => {
    const lowerProb = (1 - level) / 2;
    const upperProb = 1 - lowerProb;

    const lowerBand = ranks.map((m) => {
      const beta_mean = m / (n + 1);
      const beta_var = (m * (n - m + 1)) / ((n + 1) ** 2 * (n + 2));
      const rhs = (beta_mean * (1 - beta_mean)) / beta_var - 1;
      const a = beta_mean * rhs;
      const b = (1 - beta_mean) * rhs;
      return jStat.beta.inv(lowerProb, a, b);
    });

    const upperBand = ranks.map((m) => {
      const beta_mean = m / (n + 1);
      const beta_var = (m * (n - m + 1)) / ((n + 1) ** 2 * (n + 2));
      const rhs = (beta_mean * (1 - beta_mean)) / beta_var - 1;
      const a = beta_mean * rhs;
      const b = (1 - beta_mean) * rhs;
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
      fillcolor: `rgba(${parseInt(beta_color.slice(1, 3), 16)}, ${parseInt(beta_color.slice(3, 5), 16)}, ${parseInt(beta_color.slice(5, 7), 16)}, ${alpha})`,
      showlegend: true,
      hoverinfo: 'skip',
      name: `${Math.round(level * 100)}% confidence`,
    });
  });

  // Add true distribution line
  const trueDistProbs = Array.from({ length: 100 }, (_, i) => (i + 1) / 101);
  let trueDistValues: number[];
  switch (selectedDistribution) {
    case 'lp3':
      trueDistValues = trueDistProbs.map((p) =>
        log_pearson_3_inv(p, 2, 5, 0.5)
      );
      break;
    case 'weibull':
      trueDistValues = trueDistProbs.map((p) => jStat.weibull.inv(p, 2, 5));
      break;
    case 'pareto':
      trueDistValues = trueDistProbs.map((p) => jStat.pareto.inv(p, 1, 2));
      break;
    case 'exponential':
    default:
      trueDistValues = trueDistProbs.map((p) => jStat.exponential.inv(p, 5));
      break;
  }

  traces.push({
    x: trueDistProbs.map((p) => jStat.normal.inv(p, 0, 1)),
    y: trueDistValues,
    mode: 'lines',
    name: 'True Distribution',
    line: {
      width: 2,
      color: '#ef4444',
      dash: 'solid',
    },
    showlegend: true,
  });

  allFormulas
    .filter((formula) => selectedFormulas.has(formula.name))
    .forEach((formula, idx) => {
      const color = colors[idx % colors.length];

      // Add the actual data points on top
      traces.push({
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
      });
    });

  // Calculate data range for dynamic tick filtering
  const allXValues = traces.flatMap((trace) => trace.x || []);
  const minX = Math.min(...allXValues);
  const maxX = Math.max(...allXValues);

  // Add invisible dummy trace for xaxis2 to make it visible
  traces.push({
    x: [minX, maxX],
    y: [rvs[0], rvs[0]],
    xaxis: 'x2',
    mode: 'markers',
    marker: { size: 0, opacity: 0 },
    showlegend: false,
    hoverinfo: 'skip',
  });

  // Define AEP ticks (Annual Exceedance Probability)
  const aepTicks = [
    { prob: 0.99, label: '0.99' },
    { prob: 0.9, label: '0.9' },
    { prob: 0.5, label: '0.5' },
    { prob: 0.2, label: '0.2' },
    { prob: 0.1, label: '0.1' },
    { prob: 0.02, label: '0.02' },
    { prob: 0.005, label: '0.005' },
    { prob: 0.0001, label: '0.0001' },
  ];

  // Define Return Period ticks
  const returnPeriodTicks = [
    { period: 1.1, label: '1.1' },
    { period: 2, label: '2' },
    { period: 5, label: '5' },
    { period: 10, label: '10' },
    { period: 50, label: '50' },
    { period: 200, label: '200' },
    { period: 1000, label: '1000' },
  ];

  // Convert to quantiles and filter by data range
  const aepTicksFiltered = aepTicks
    .map((tick) => ({
      val: jStat.normal.inv(1 - tick.prob, 0, 1),
      label: tick.label,
    }))
    .filter((tick) => tick.val >= minX && tick.val <= maxX);

  const returnPeriodTicksFiltered = returnPeriodTicks
    .map((tick) => ({
      val: jStat.normal.inv(1 - 1 / tick.period, 0, 1),
      label: tick.label,
    }))
    .filter((tick) => tick.val >= minX && tick.val <= maxX);

  const layout: Partial<Plotly.Layout> = {
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
      tickvals: aepTicksFiltered.map((t) => t.val),
      ticktext: aepTicksFiltered.map((t) => t.label),
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
      tickvals: returnPeriodTicksFiltered.map((t) => t.val),
      ticktext: returnPeriodTicksFiltered.map((t) => t.label),
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

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  Plotly.newPlot(plotDiv, traces, layout, config);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
