import './style.css';
import './math';
import type { AppState, DistributionType } from './types';
import {
  DEFAULT_FORMULA,
  DEFAULT_DISTRIBUTION,
  DEFAULT_SAMPLING_MODE,
} from './constants';
import { generateRandomSamples } from './distributions';
import { renderPlot } from './plotting';
import {
  createDistributionSelector,
  createFormulaSelector,
  setupSampleSizeControls,
  getDistributionParams,
} from './ui';
import { runMonteCarloSimulation, renderMonteCarloPlot } from './monteCarlo';

// Application state
const state: AppState = {
  sampleSize: 10,
  selectedFormula: DEFAULT_FORMULA,
  selectedDistribution: DEFAULT_DISTRIBUTION,
  samplingMode: DEFAULT_SAMPLING_MODE,
  randomSamples: [],
};

// DOM Elements
let plotDiv: HTMLElement;
let sampleSizeInput: HTMLInputElement;

// Monte Carlo DOM Elements
let mcPlotDiv: HTMLElement;
let mcSampleSizeInput: HTMLInputElement;
let mcRepetitionsInput: HTMLInputElement;
let mcPercentileInput: HTMLInputElement;
let mcRunButton: HTMLButtonElement;
let mcLockTotalCheckbox: HTMLInputElement;
let mcBalanceSlider: HTMLInputElement;
let mcTotalSamplesSpan: HTMLElement;

/**
 * Initialize the application
 */
function init(): void {
  // Get DOM references
  plotDiv = document.getElementById('plot')!;
  sampleSizeInput = document.getElementById('sample-size') as HTMLInputElement;

  // Monte Carlo DOM references
  mcPlotDiv = document.getElementById('mc-plot')!;
  mcSampleSizeInput = document.getElementById(
    'mc-sample-size'
  ) as HTMLInputElement;
  mcRepetitionsInput = document.getElementById(
    'mc-repetitions'
  ) as HTMLInputElement;
  mcPercentileInput = document.getElementById(
    'mc-percentile'
  ) as HTMLInputElement;
  mcRunButton = document.getElementById(
    'mc-run-simulation'
  ) as HTMLButtonElement;
  mcLockTotalCheckbox = document.getElementById(
    'mc-lock-total'
  ) as HTMLInputElement;
  mcBalanceSlider = document.getElementById(
    'mc-balance-slider'
  ) as HTMLInputElement;
  mcTotalSamplesSpan = document.getElementById('mc-total-samples')!;

  // Initialize state from DOM
  state.sampleSize = parseInt(sampleSizeInput.value);

  // Setup UI components
  initializeUI();

  // Initial plot
  updatePlot();
}

/**
 * Initialize all UI components
 */
function initializeUI(): void {
  const distributionContainer = document.getElementById(
    'distribution-selector'
  ) as HTMLSelectElement;
  const formulaContainer = document.getElementById('formula-selector')!;

  // Create distribution selector
  createDistributionSelector(
    distributionContainer,
    state.selectedDistribution,
    handleDistributionChange
  );

  // Create formula selector
  createFormulaSelector(
    formulaContainer,
    state.selectedFormula,
    handleFormulaChange
  );

  // Setup Monte Carlo controls
  setupMonteCarloControls();

  // Setup sample size controls and randomize button
  setupSampleSizeControls(
    sampleSizeInput,
    handleSampleSizeChange,
    handleRandomize
  );

  // Run initial Monte Carlo simulation
  setTimeout(() => handleRunMonteCarlo(), 100);
}

/**
 * Handle distribution change
 */
function handleDistributionChange(distribution: DistributionType): void {
  state.selectedDistribution = distribution;
  regenerateRandomSamples();
  updatePlot();
}

/**
 * Handle formula selection change
 */
function handleFormulaChange(formula: string): void {
  state.selectedFormula = formula;
  updatePlot();
}

/**
 * Handle randomize button click
 */
function handleRandomize(): void {
  regenerateRandomSamples();
  updatePlot();
}

/**
 * Handle sample size change
 */
function handleSampleSizeChange(): void {
  state.sampleSize = parseInt(sampleSizeInput.value);
  updatePlot();
}

/**
 * Regenerate random samples
 */
function regenerateRandomSamples(): void {
  const params = getDistributionParams(state.selectedDistribution);
  state.randomSamples = generateRandomSamples(
    state.selectedDistribution,
    state.sampleSize,
    params
  );
}

/**
 * Update the plot with current state
 */
function updatePlot(): void {
  // Get samples based on sampling mode
  const samples = getSamples();
  const params = getDistributionParams(state.selectedDistribution);

  // Render the plot
  renderPlot(
    plotDiv,
    samples,
    state.selectedFormula,
    state.selectedDistribution,
    params
  );
}

/**
 * Get samples - always uses random sampling
 */
function getSamples(): number[] {
  // Use random samples (regenerate if size changed)
  if (state.randomSamples.length !== state.sampleSize) {
    regenerateRandomSamples();
  }
  return state.randomSamples;
}

/**
 * Update slider position from current input values
 */
function updateBalanceFromInputs(): void {
  const n = parseInt(mcSampleSizeInput.value) || 1;
  const r = parseInt(mcRepetitionsInput.value) || 1;
  const total = n * r;

  // Calculate balance: 0 = all in n, 100 = all in r
  // Use log scale for better distribution
  const logN = Math.log(n);
  const logR = Math.log(r);

  // Balance from 0 to 100
  const balance = 50 + ((logR - logN) / (2 * Math.log(total))) * 100;
  mcBalanceSlider.value = Math.max(0, Math.min(100, balance)).toString();
}

/**
 * Update input values from slider position
 */
function updateInputsFromBalance(): void {
  const balance = parseFloat(mcBalanceSlider.value);
  const total =
    parseInt(mcSampleSizeInput.value) * parseInt(mcRepetitionsInput.value);

  // Convert balance (0-100) to n and r
  // balance 50 = roughly equal, 0 = maximize n, 100 = maximize r
  const ratio = Math.pow(10, (balance - 50) / 25); // Range from 0.01 to 100

  // n * r = total and r/n = ratio, so n = sqrt(total/ratio), r = sqrt(total*ratio)
  let n = Math.round(Math.sqrt(total / ratio));
  n = Math.max(1, n);
  let r = Math.round(total / n);
  r = Math.max(1, r);

  mcSampleSizeInput.value = n.toString();
  mcRepetitionsInput.value = r.toString();

  // Update total display
  mcTotalSamplesSpan.textContent = (n * r).toLocaleString();
}

/**
 * Setup Monte Carlo simulation controls
 */
function setupMonteCarloControls(): void {
  // Debounce timer for slider
  let debounceTimer: number | null = null;

  // Run simulation button
  mcRunButton.addEventListener('click', handleRunMonteCarlo);

  // Update total samples display
  const updateTotalSamples = () => {
    const n = parseInt(mcSampleSizeInput.value) || 1;
    const r = parseInt(mcRepetitionsInput.value) || 1;
    const total = n * r;
    mcTotalSamplesSpan.textContent = total.toLocaleString();
  };

  // Lock total checkbox
  mcLockTotalCheckbox.addEventListener('change', () => {
    if (mcLockTotalCheckbox.checked) {
      mcBalanceSlider.disabled = false;
      mcSampleSizeInput.disabled = true;
      mcRepetitionsInput.disabled = true;
      updateBalanceFromInputs();
    } else {
      mcBalanceSlider.disabled = true;
      mcSampleSizeInput.disabled = false;
      mcRepetitionsInput.disabled = false;
    }
  });

  // Balance slider with debounced simulation
  mcBalanceSlider.addEventListener('input', () => {
    if (mcLockTotalCheckbox.checked) {
      updateInputsFromBalance();

      // Clear existing timer
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }

      // Set new timer to run simulation after user stops moving slider
      debounceTimer = window.setTimeout(() => {
        handleRunMonteCarlo();
        debounceTimer = null;
      }, 150); // 150ms delay after slider stops moving
    }
  });

  // Update total when inputs change
  mcSampleSizeInput.addEventListener('input', updateTotalSamples);
  mcRepetitionsInput.addEventListener('input', updateTotalSamples);

  // Initialize state
  mcBalanceSlider.disabled = true; // Start disabled since checkbox is unchecked
  updateTotalSamples();
}

/**
 * Handle Monte Carlo simulation run
 */
function handleRunMonteCarlo(): void {
  const n = parseInt(mcSampleSizeInput.value);
  const repetitions = parseInt(mcRepetitionsInput.value);
  const percentile = parseFloat(mcPercentileInput.value);

  // Convert percentile to order statistic (round to nearest integer)
  const orderStatistic = Math.max(
    1,
    Math.min(n, Math.round((percentile / 100) * n))
  );

  // Validate inputs
  if (n < 1 || repetitions < 1 || percentile < 0 || percentile > 100) {
    alert('Invalid input values. Please check your inputs.');
    return;
  }

  // Get distribution parameters
  const params = getDistributionParams(state.selectedDistribution);

  // Run simulation
  const percentiles = runMonteCarloSimulation(
    state.selectedDistribution,
    n,
    repetitions,
    orderStatistic,
    params
  );

  // Render plot
  renderMonteCarloPlot(mcPlotDiv, percentiles, n, orderStatistic, repetitions);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
