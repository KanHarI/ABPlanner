import { DeltaType } from '../types';
import { inverseSigmoid, sigmoid } from './sigmoid';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cephes = require('cephes');

/**
 * Estimates the probability P(A < B) using a normal approximation.
 *
 * This method approximates the Beta distributions as normal distributions
 * and computes the probability based on the difference of means and variances.
 *
 * @param parameters - Contains distributions A, B, and optional delta adjustment.
 * @returns The estimated probability P(A < B) or undefined if approximation fails.
 */
export function normalApproxBetaALtB(parameters: {
  A: { a: number; b: number };
  B: { a: number; b: number };
  delta?: { type: DeltaType; value: number };
}): number | undefined {
  try {
    const { A, B, delta } = parameters;

    // Compute means and variances for Beta distributions A and B
    const meanA = A.a / (A.a + A.b);
    const meanB = B.a / (B.a + B.b);
    const varianceA = (A.a * A.b) / ((A.a + A.b) ** 2 * (A.a + A.b + 1));
    const varianceB = (B.a * B.b) / ((B.a + B.b) ** 2 * (B.a + B.b + 1));

    // Apply delta adjustment to A
    const adjustedMeanA = adjustMean(meanA, varianceA, delta);

    // Compute mean difference and combined variance
    const meanDiff = meanB - adjustedMeanA.mean;
    const combinedVariance = varianceB + adjustedMeanA.variance;

    // Compute probability using the normal cumulative distribution function
    return cephes.ndtr(meanDiff / Math.sqrt(combinedVariance));
  } catch (e) {
    console.error('Error in normalApproxBetaALtB:', e);
    return undefined;
  }
}

/**
 * Adjusts the mean and variance of a Beta distribution based on the delta adjustment.
 *
 * @param mean - Original mean of the Beta distribution.
 * @param variance - Original variance of the Beta distribution.
 * @param delta - Delta adjustment (constant, relative, or logit).
 * @returns Adjusted mean and variance.
 */
function adjustMean(
  mean: number,
  variance: number,
  delta?: { type: DeltaType; value: number }
): { mean: number; variance: number } {
  if (!delta) {
    return { mean, variance };
  }

  let adjustedMean = mean;
  let adjustedVariance = variance;

  switch (delta.type) {
    case 'constant':
      adjustedMean += delta.value;
      break;

    case 'relative':
      adjustedMean *= 1 + delta.value;
      adjustedVariance *= (1 + delta.value) ** 2;
      break;

    case 'logit':
      // Logit adjustment affects the mean only
      adjustedMean = sigmoid(inverseSigmoid(mean) + delta.value);
      break;

    default:
      throw new Error(`Unknown delta type: ${delta.type}`);
  }

  // Clamp the mean between 0 and 1
  adjustedMean = Math.min(1, Math.max(0, adjustedMean));

  return { mean: adjustedMean, variance: adjustedVariance };
}
