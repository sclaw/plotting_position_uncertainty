/**
 * UI and DOM manipulation utilities
 */

import type { DistributionType } from './types';
import { DISTRIBUTIONS, DIST_PARAMS } from './constants';
import { allFormulas } from './plottingPositions';

type EventCallback = () => void;

// Store current parameter values
const currentParams: Record<string, any> = {
  lp3: { ...DIST_PARAMS.LP3 },
  exponential: { ...DIST_PARAMS.EXPONENTIAL },
  weibull: { ...DIST_PARAMS.WEIBULL },
  pareto: { ...DIST_PARAMS.PARETO },
};

/**
 * Create the distribution selector UI
 */
export function createDistributionSelector(
  container: HTMLSelectElement,
  selectedDistribution: DistributionType,
  onChange: (distribution: DistributionType) => void
): void {
  // Create options for the select dropdown
  DISTRIBUTIONS.forEach((dist) => {
    const option = document.createElement('option');
    option.value = dist.value;
    option.textContent = dist.label;
    option.selected = dist.value === selectedDistribution;
    container.appendChild(option);
  });

  // Handle distribution change
  container.addEventListener('change', () => {
    const distribution = container.value as DistributionType;
    updateParameterInputs(distribution, onChange);
    updateDistributionSummary(distribution);
    onChange(distribution);
  });

  // Initialize parameter inputs and summary
  updateParameterInputs(selectedDistribution, onChange);
  updateDistributionSummary(selectedDistribution);
}

/**
 * Update the parameter inputs based on selected distribution
 */
function updateParameterInputs(
  distribution: DistributionType,
  onChange: (distribution: DistributionType) => void
): void {
  const container = document.getElementById('distribution-parameters');
  if (!container) return;

  // Clear existing inputs
  container.innerHTML = '';

  // Define parameter configurations for each distribution
  const paramConfigs: Record<
    DistributionType,
    Array<{ key: string; label: string; symbol: string }>
  > = {
    lp3: [
      { key: 'mu', label: 'Mean (μ)', symbol: 'μ' },
      { key: 'sigma', label: 'Standard Deviation (σ)', symbol: 'σ' },
      { key: 'gamma', label: 'Skew (γ)', symbol: 'γ' },
      { key: 'base', label: 'Log Base', symbol: 'base' },
    ],
    exponential: [{ key: 'lambda', label: 'Rate (λ)', symbol: 'λ' }],
    weibull: [
      { key: 'k', label: 'Shape (k)', symbol: 'k' },
      { key: 'lambda', label: 'Scale (λ)', symbol: 'λ' },
    ],
    pareto: [
      { key: 'xm', label: 'Minimum (xₘ)', symbol: 'xₘ' },
      { key: 'alpha', label: 'Shape (α)', symbol: 'α' },
    ],
  };

  const configs = paramConfigs[distribution];
  if (!configs) return;

  // Add label
  const labelDiv = document.createElement('div');
  labelDiv.className = 'text-sm font-medium text-gray-300';
  labelDiv.textContent = 'Parameters:';
  container.appendChild(labelDiv);

  // Create inputs for each parameter
  configs.forEach(({ key, label }) => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'flex items-center gap-2';

    const labelEl = document.createElement('label');
    labelEl.className = 'text-sm text-gray-300 w-40';
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = key === 'gamma' ? '0.1' : key === 'base' ? '1' : '0.01';
    input.min = key === 'base' ? '2' : '0.01';
    input.value = String(currentParams[distribution][key]);
    input.className =
      'flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

    input.addEventListener('change', () => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        currentParams[distribution][key] = value;
        updateDistributionSummary(distribution);
        onChange(distribution);
      }
    });

    inputGroup.appendChild(labelEl);
    inputGroup.appendChild(input);
    container.appendChild(inputGroup);
  });
}

/**
 * Update the distribution summary text
 */
function updateDistributionSummary(distribution: DistributionType): void {
  const summaryText = document.getElementById('distribution-summary-text');
  if (!summaryText) return;

  const dist = DISTRIBUTIONS.find((d) => d.value === distribution);
  if (!dist) return;

  // Build parameter string from current values
  let paramStr = '';
  const params = currentParams[distribution];

  switch (distribution) {
    case 'lp3':
      paramStr = `(μ=${params.mu}, σ=${params.sigma}, γ=${params.gamma})`;
      break;
    case 'exponential':
      paramStr = `(λ=${params.lambda})`;
      break;
    case 'weibull':
      paramStr = `(k=${params.k}, λ=${params.lambda})`;
      break;
    case 'pareto':
      paramStr = `(xₘ=${params.xm}, α=${params.alpha})`;
      break;
  }

  summaryText.textContent = `${dist.label} ${paramStr}`;
}

/**
 * Get current parameter values for a distribution
 */
export function getDistributionParams(distribution: DistributionType): any {
  return { ...currentParams[distribution] };
}

/**
 * Create the formula selector UI
 */
export function createFormulaSelector(
  container: HTMLElement,
  selectedFormula: string,
  onChange: (formula: string) => void
): void {
  // Create the details/summary structure
  const details = document.createElement('details');
  details.className = 'bg-gray-700 border border-gray-600 rounded-lg group';
  details.setAttribute('closed', '');

  // Create summary element
  const summary = document.createElement('summary');
  summary.id = 'formula-summary';
  summary.className =
    'px-4 py-3 cursor-pointer select-none hover:bg-gray-650 transition-colors rounded-lg list-none flex items-center justify-between';

  summary.innerHTML = `
    <div class="flex-1">
      <div class="text-sm font-medium text-gray-400 mb-1">Plotting Position Method</div>
      <div class="text-white font-medium" id="formula-summary-text">${selectedFormula}</div>
    </div>
    <svg class="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;

  details.appendChild(summary);

  // Create content container
  const content = document.createElement('div');
  content.className = 'border-t border-gray-600';

  const innerContent = document.createElement('div');
  innerContent.className = 'p-4 space-y-2';

  // Add radio button options for each formula
  allFormulas.forEach((formula) => {
    const option = createFormulaOption(
      formula.name,
      formula.description,
      formula.name === selectedFormula,
      () => {
        handleFormulaSelect(formula.name, onChange);
      }
    );
    innerContent.appendChild(option);
  });

  content.appendChild(innerContent);
  details.appendChild(content);
  container.appendChild(details);

  // Initialize summary text
  updateFormulaSummary(selectedFormula);
}

/**
 * Create a single formula option element with radio button
 */
function createFormulaOption(
  name: string,
  description: string,
  isChecked: boolean,
  onSelect: EventCallback
): HTMLLabelElement {
  const option = document.createElement('label');
  option.className =
    'flex items-start px-4 py-3 hover:bg-gray-600 cursor-pointer transition-colors rounded-lg border border-gray-600';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'formula-selector';
  radio.value = name;
  radio.checked = isChecked;
  radio.className =
    'mt-1 mr-3 w-4 h-4 text-blue-500 bg-gray-800 border-gray-500 focus:ring-blue-500 focus:ring-2 cursor-pointer';
  radio.addEventListener('change', onSelect);

  const textContainer = document.createElement('div');
  textContainer.className = 'flex-1';

  const title = document.createElement('div');
  title.className = 'text-white font-medium';
  title.textContent = name;

  const subtitle = document.createElement('div');
  subtitle.className = 'text-gray-400 text-sm mt-0.5';
  subtitle.textContent = description;

  textContainer.appendChild(title);
  textContainer.appendChild(subtitle);
  option.appendChild(radio);
  option.appendChild(textContainer);

  return option;
}

/**
 * Handle formula selection
 */
function handleFormulaSelect(
  formula: string,
  onChange: (formula: string) => void
): void {
  updateFormulaSummary(formula);
  onChange(formula);
}

/**
 * Update the formula summary text
 */
function updateFormulaSummary(formulaName: string): void {
  const summaryText = document.getElementById('formula-summary-text');
  if (!summaryText) return;

  summaryText.textContent = formulaName;
}

/**
 * Setup sample size controls and randomize button
 */
export function setupSampleSizeControls(
  sampleSizeInput: HTMLInputElement,
  onChange: EventCallback,
  onRandomize: EventCallback
): void {
  sampleSizeInput.addEventListener('input', onChange);

  const decreaseBtn = document.getElementById('decrease-sample-size')!;
  const increaseBtn = document.getElementById('increase-sample-size')!;

  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(sampleSizeInput.value);
    const minValue = parseInt(sampleSizeInput.min);
    if (currentValue > minValue) {
      sampleSizeInput.value = Math.floor(currentValue / 2).toString();
      onChange();
    }
  });

  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(sampleSizeInput.value);
    const maxValue = parseInt(sampleSizeInput.max);
    if (currentValue < maxValue) {
      sampleSizeInput.value = (currentValue * 2).toString();
      onChange();
    }
  });

  // Setup randomize button
  const randomizeBtn = document.getElementById('randomize-btn')!;
  randomizeBtn.addEventListener('click', onRandomize);
}
