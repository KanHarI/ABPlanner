import { betaSample } from './distributions';
import { sigmoid, inverseSigmoid } from './sigmoid';
import {
  estimateProbabilityNaive,
  mannWhitneyEstimateProbabilityOfALessThanB,
} from './pairwiseComparison';
import { MONTE_CARLO_DEFAULT_SAMPLE_SIZE } from '../constants';

/**
 * Estimates the probability Beta(A < B) using a sample-based approach.
 *
 * @param parameters - Contains distributions A, B, delta adjustment, and number of samples.
 * @returns The estimated probability Beta(A < B).
 */
export function sampleBasedBetaALtB(parameters: {
  A: { a: number; b: number };
  B: { a: number; b: number };
  delta?: { type: 'constant' | 'relative' | 'logit'; value: number };
  samples?: number;
  pairwiseMethod?: 'naive' | 'mann-whitney';
}): number {
  const { A, B, delta, samples = MONTE_CARLO_DEFAULT_SAMPLE_SIZE } = parameters;

  // Generate samples for A and B
  const A_samples = generateBetaSamples(A.a, A.b, samples);
  const B_samples = generateBetaSamples(B.a, B.b, samples);

  // Apply delta adjustment to A samples if delta is provided
  if (delta) {
    applyDeltaToSamples(A_samples, delta);
  }

  if (parameters.pairwiseMethod === 'naive') {
    return estimateProbabilityNaive(A_samples, B_samples);
  } else {
    return mannWhitneyEstimateProbabilityOfALessThanB(A_samples, B_samples);
  }
}

/**
 * Generates samples from a Beta distribution.
 *
 * @param a - Alpha parameter of the Beta distribution.
 * @param b - Beta parameter of the Beta distribution.
 * @param sampleSize - Number of samples to generate.
 * @returns An array of samples.
 */
function generateBetaSamples(
  a: number,
  b: number,
  sampleSize: number
): number[] {
  return Array.from({ length: sampleSize }, () => betaSample(a, b));
}

/**
 * Applies a delta adjustment to a set of samples.
 *
 * @param samples - Array of samples to adjust.
 * @param delta - Adjustment to apply to the samples.
 */
function applyDeltaToSamples(
  samples: number[],
  delta: { type: 'constant' | 'relative' | 'logit'; value: number }
): void {
  for (let i = 0; i < samples.length; i++) {
    switch (delta.type) {
      case 'constant':
        samples[i] += delta.value;
        break;
      case 'relative':
        samples[i] *= 1 + delta.value;
        break;
      case 'logit':
        samples[i] = sigmoid(inverseSigmoid(samples[i]) + delta.value);
        break;
    }
    // Clamp the samples between 0 and 1
    samples[i] = Math.min(1, Math.max(0, samples[i]));
  }
}
