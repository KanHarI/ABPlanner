/**
 * Estimates the probability P(A < B) using the "two-pointer" approach.
 *
 * This method is based on the Mann–Whitney U test, a non-parametric test that
 * calculates the probability that a random draw from one distribution is less
 * than a random draw from another distribution.
 *
 * @param samplesA - Array of samples from distribution A.
 * @param samplesB - Array of samples from distribution B.
 * @returns The estimated probability P(A < B).
 */
export function mannWhitneyEstimateProbabilityOfALessThanB(
  samplesA: number[],
  samplesB: number[]
): number {
  // Sort both arrays
  const A = [...samplesA].sort((a, b) => a - b);
  const B = [...samplesB].sort((a, b) => a - b);

  const N_A = A.length;
  const N_B = B.length;

  let i = 0; // Pointer for A
  let j = 0; // Pointer for B
  let count = 0; // Counts how many (a, b) pairs satisfy a < b

  // Single-pass merge logic
  while (i < N_A && j < N_B) {
    if (A[i] < B[j]) {
      // A[i] is less than all remaining elements in B (B[j], B[j+1], ...)
      count += N_B - j;
      i++;
    } else {
      // Move to the next element in B
      j++;
    }
  }

  // Return probability
  return count / (N_A * N_B);
}

/**
 * Estimates the probability P(A < B) using a naive comparison approach.
 *
 * This method compares every pair (a, b) with a in A and b in B. It is less
 * efficient than the two-pointer approach and should only be used for small sample sizes.
 *
 * @param samplesA - Array of samples from distribution A.
 * @param samplesB - Array of samples from distribution B.
 * @returns The estimated probability P(A < B).
 */
export function estimateProbabilityNaive(
  samplesA: number[],
  samplesB: number[]
): number {
  const N_A = samplesA.length;
  const N_B = samplesB.length;

  let count = 0;

  // Compare every pair (a, b)
  for (const a of samplesA) {
    for (const b of samplesB) {
      if (a < b) {
        count++;
      }
    }
  }

  // Return probability
  return count / (N_A * N_B);
}
