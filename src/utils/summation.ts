// eslint-disable-next-line @typescript-eslint/no-require-imports
const cephes = require('cephes');

/**
 * Computes the probability Beta(A < B) using a summation-based method
 * for integer inputs of A and B.
 * This method is computationally efficient for smaller integer parameters.
 *
 * @param parameters - Contains distributions A and B.
 * @returns The probability Beta(A < B) or undefined in case of errors.
 */
export function summationBetaALtB(parameters: {
  A: { a: number; b: number };
  B: { a: number; b: number };
}): number | undefined {
  try {
    const { A, B } = parameters;

    if (!Number.isInteger(A.a) || !Number.isInteger(A.b) || !Number.isInteger(B.a) || !Number.isInteger(B.b)) {
      return undefined;
    }

    // Determine which distribution to use as the main summation loop
    if (B.a <= B.b && B.a <= A.a && B.a <= A.b) {
      return computeSummation(A, B);
    }
    if (A.b <= B.b && A.b <= A.a && A.b <= B.a) {
      return 1 - computeSummation(B, A);
    }
    if (A.a <= B.b && A.a <= A.b && A.a <= B.a) {
      const reflectedA = { a: A.b, b: A.a };
      const reflectedB = { a: B.b, b: B.a };
      return 1 - computeSummation(reflectedA, reflectedB);
    }

    // If all else fails, reflect both distributions
    const reflectedA = { a: A.b, b: A.a };
    const reflectedB = { a: B.b, b: B.a };
    return computeSummation(reflectedB, reflectedA);
  } catch (e) {
    console.error('Error in summationBetaALtB:', e);
    return undefined;
  }
}

/**
 * Internal function to compute the summation-based integral for Beta(A < B).
 * This is optimized for integer parameters.
 *
 * @param A - Parameters of Beta distribution A.
 * @param B - Parameters of Beta distribution B.
 * @returns The computed summation result.
 */
function computeSummation(
  A: { a: number; b: number },
  B: { a: number; b: number }
): number {
  let total = 0;

  // Perform summation for integer values of B.a
  for (let i = 0; i < B.a; i++) {
    total += Math.exp(
      cephes.lbeta(A.a + i, B.b + A.b) -
        Math.log(B.b + i) -
        cephes.lbeta(1 + i, B.b) -
        cephes.lbeta(A.a, A.b)
    );
  }

  return total;
}
