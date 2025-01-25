import { betaPdf, betaCdf } from './distributions';
import { sigmoid, inverseSigmoid } from './sigmoid';
import { NUMERICAL_INTEGRAL_DEFAULT_STEPS } from '../constants';
import {Delta, DeltaType, NumericalIntegrationParams} from '../types';

/**
 * Public function to compute the numerical integral for Beta(A < B).
 */
export function integralBetaALtB(
  parameters: NumericalIntegrationParams
): number | undefined {
  try {
    const { A, B, delta, steps } = parameters;

    // Calculate direct and complement integrals
    const value1 = computeIntegral({ A, B, delta, steps });
    let inverseDelta: undefined | Delta = undefined;
    if (delta !== undefined) {
      switch (delta?.type) {
        case 'constant':
          inverseDelta = { type: 'constant', value: -delta.value };
          break;
        case 'relative':
          inverseDelta = { type: 'relative', value: 1/(delta.value+1)-1 };
          break;
        case 'logit':
          inverseDelta = { type: 'logit', value: -delta.value };
          break;
      }
    }
    const value2 = computeIntegral({
      A: B,
      B: A,
      delta: inverseDelta,
      steps,
    });

    return (value1 + (1 - value2)) / 2; // Average the direct and complement values
  } catch (e) {
    console.error('Error during numerical integration:', e);
    return undefined;
  }
}

/**
 * Core function to compute the integral for Beta(A < B).
 */
function computeIntegral(parameters: NumericalIntegrationParams): number {
  const { A, B, delta, steps = NUMERICAL_INTEGRAL_DEFAULT_STEPS } = parameters;

  const { a: aA, b: bA } = A;
  const { a: aB, b: bB } = B;

  // Calculate peaks and widths
  const AStats = calculatePeakAndWidth(aA, bA);
  const BStats = calculatePeakAndWidth(aB, bB);

  // Generate schema for integration steps
  const stepsSchema = generateStepsSchema(AStats, BStats, steps);

  // Create a precomputed integrand function
  const integrand = createPrecomputedIntegrand(aA, bA, aB, bB, delta);

  // Perform numerical integration using trapezoidal rule
  return performTrapezoidalIntegration(stepsSchema, integrand);
}

/**
 * Calculates the peak and width of a beta distribution.
 */
function calculatePeakAndWidth(
  a: number,
  b: number
): { peak: number; width: number } {
  const peak = (a - 1) / (a + b - 2);
  const width = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
  return { peak, width: width * 4 }; // Extend width for integration range
}

/**
 * Generates a schema dividing the integration range into subranges.
 */
function generateStepsSchema(
  A: { peak: number; width: number },
  B: { peak: number; width: number },
  totalSteps: number
): Array<{ start: number; end: number; steps: number }> {
  const AStart = Math.max(0, A.peak - A.width);
  const AEnd = Math.min(1, A.peak + A.width);
  const BStart = Math.max(0, B.peak - B.width);
  const BEnd = Math.min(1, B.peak + B.width);

  const stepAllocation = totalSteps / 5;

  if (AEnd < BStart || BEnd < AStart) {
    // Disjoint ranges
    return [
      { start: 0, end: AStart, steps: stepAllocation },
      { start: AStart, end: AEnd, steps: stepAllocation },
      { start: AEnd, end: BStart, steps: stepAllocation },
      { start: BStart, end: BEnd, steps: stepAllocation },
      { start: BEnd, end: 1, steps: stepAllocation },
    ];
  }

  if (AStart >= BStart && AEnd <= BEnd) {
    // A inside B
    return [
      { start: 0, end: BStart, steps: stepAllocation },
      { start: BStart, end: AStart, steps: stepAllocation },
      { start: AStart, end: AEnd, steps: stepAllocation },
      { start: AEnd, end: BEnd, steps: stepAllocation },
      { start: BEnd, end: 1, steps: stepAllocation },
    ];
  }

  if (BStart >= AStart && BEnd <= AEnd) {
    // B inside A
    return [
      { start: 0, end: AStart, steps: stepAllocation },
      { start: AStart, end: BStart, steps: stepAllocation },
      { start: BStart, end: BEnd, steps: stepAllocation },
      { start: BEnd, end: AEnd, steps: stepAllocation },
      { start: AEnd, end: 1, steps: stepAllocation },
    ];
  }

  // Partially overlapping ranges
  return [
    { start: 0, end: Math.min(AStart, BStart), steps: stepAllocation },
    {
      start: Math.min(AStart, BStart),
      end: Math.max(AStart, BStart),
      steps: stepAllocation,
    },
    {
      start: Math.max(AStart, BStart),
      end: Math.min(AEnd, BEnd),
      steps: stepAllocation,
    },
    {
      start: Math.min(AEnd, BEnd),
      end: Math.max(AEnd, BEnd),
      steps: stepAllocation,
    },
    { start: Math.max(AEnd, BEnd), end: 1, steps: stepAllocation },
  ];
}

/**
 * Performs trapezoidal integration based on the provided schema.
 */
function performTrapezoidalIntegration(
  stepsSchema: Array<{ start: number; end: number; steps: number }>,
  integrand: (x: number) => number
): number {
  let sum = 0;

  for (const { start, end, steps } of stepsSchema) {
    const stepSize = (end - start) / steps;
    let lastValue = integrand(start);

    for (let i = 1; i <= steps; i++) {
      const x = start + i * stepSize;
      const currentValue = integrand(x);
      sum += 0.5 * (lastValue + currentValue) * stepSize;
      lastValue = currentValue;
    }
  }

  return sum;
}

/**
 * Creates a precomputed integrand function based on the delta type.
 * Precomputes the delta logic to avoid overhead in the inner loop.
 */
function createPrecomputedIntegrand(
  aA: number,
  bA: number,
  aB: number,
  bB: number,
  delta?: { type: DeltaType; value: number }
): (x: number) => number {
  if (!delta) {
    // No delta adjustment
    return (x: number) => betaPdf(aA, bA, x) * (1 - betaCdf(aB, bB, x));
  }

  // Precompute delta logic for specific type
  const deltaValue = delta.value;
  switch (delta.type) {
    case 'constant':
      return (x: number) => {
        const adjustedB = Math.min(1, Math.max(0, x + deltaValue));
        return betaPdf(aA, bA, x) * (1 - betaCdf(aB, bB, adjustedB));
      };
    case 'relative':
      return (x: number) => {
        const adjustedB = Math.min(1, Math.max(0, x * (1 + deltaValue)));
        return betaPdf(aA, bA, x) * (1 - betaCdf(aB, bB, adjustedB));
      };
    case 'logit':
      return (x: number) => {
        const adjustedB = Math.min(
          1,
          Math.max(0, sigmoid(inverseSigmoid(x) + deltaValue))
        );
        return betaPdf(aA, bA, x) * (1 - betaCdf(aB, bB, adjustedB));
      };
    default:
      throw new Error(`Unknown delta type: ${delta.type}`);
  }
}
