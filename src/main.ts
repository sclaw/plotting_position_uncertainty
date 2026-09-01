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

/**
 * Initialize the application
 */
function init(): void {
  // Get DOM references
  plotDiv = document.getElementById('plot')!;
  sampleSizeInput = document.getElementById('sample-size') as HTMLInputElement;

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

  // Setup sample size controls and randomize button
  setupSampleSizeControls(
    sampleSizeInput,
    handleSampleSizeChange,
    handleRandomize
  );
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
