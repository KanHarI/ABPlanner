// eslint-disable-next-line @typescript-eslint/no-require-imports
const cephes = require('cephes');

// https://www.netlib.org/cephes/
// https://github.com/jeremybarnes/cephes/blob/master/misc/beta.c
// Computes the probability density function of the beta distribution
export function betaPdf(a: number, b: number, x: number): number {
  return (Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)) / cephes.beta(a, b);
}

// https://www.netlib.org/cephes/
// https://github.com/nearform/node-cephes/blob/master/cephes/incbet.c
// Computes the commulative distribution function of the beta distribution
export function betaCdf(a: number, b: number, x: number): number {
  return cephes.incbet(a, b, x);
}

// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
export function gaussianSample(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Sample from a Poisson(λ) distribution using a simple method:
 *   - This is O(λ) on average. Fine if λ is not huge.
 *   - For very large λ, consider a more sophisticated approach (e.g. "Poisson via subroutines").
 *   A GPT-o1 implementation. Will be tested as part of the binomial distribution tests.
 */
export function poissonSample(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  while (p > L) {
    k++;
    p *= Math.random();
  }
  return k - 1;
}

// The following sampling functions are translated from C to js from numpy
// https://github.com/numpy/numpy/blob/5cae51e794d69dd553104099305e9f92db237c53/numpy/random/src/distributions/distributions.c
// Sample a random variable from the exponential distribution.
export function exponentialSample(): number {
  return -Math.log(1.0 - Math.random());
}

// Sample a random variable from the gamma distribution.
export function gammaSample(shape: number): number {
  let b, c, U, V, X, Y;

  if (shape === 1.0) {
    return exponentialSample();
  } else if (shape === 0.0) {
    return 0.0;
  } else if (shape < 1.0) {
    while (true) {
      U = Math.random();
      V = exponentialSample();

      if (U <= 1.0 - shape) {
        X = Math.pow(U, 1.0 / shape);
        if (X <= V) {
          return X;
        }
      } else {
        Y = -Math.log((1 - U) / shape);
        X = Math.pow(1.0 - shape + shape * Y, 1.0 / shape);
        if (X <= V + Y) {
          return X;
        }
      }
    }
  } else {
    b = shape - 1.0 / 3.0;
    c = 1.0 / Math.sqrt(9 * b);
    while (true) {
      do {
        X = gaussianSample();
        V = 1.0 + c * X;
      } while (V <= 0.0);

      V = V * V * V;
      U = Math.random();
      if (U < 1.0 - 0.0331 * Math.pow(X, 4)) {
        return b * V;
      }
      if (Math.log(U) < 0.5 * X * X + b * (1.0 - V + Math.log(V))) {
        return b * V;
      }
    }
  }
}

// Sample a random variable from the beta distribution.
export function betaSample(a: number, b: number): number {
  let Ga, Gb;

  if (a <= 1.0 && b <= 1.0) {
    let U, V, X, Y;
    while (true) {
      U = Math.random();
      V = Math.random();
      X = Math.pow(U, 1.0 / a);
      Y = Math.pow(V, 1.0 / b);

      if (X + Y <= 1.0) {
        if (X + Y > 0) {
          return X / (X + Y);
        } else {
          let logX = Math.log(U) / a;
          let logY = Math.log(V) / b;
          const logM = Math.max(logX, logY);
          logX -= logM;
          logY -= logM;
          return Math.exp(logX - Math.log(Math.exp(logX) + Math.exp(logY)));
        }
      }
    }
  } else {
    Ga = gammaSample(a);
    Gb = gammaSample(b);
    return Ga / (Ga + Gb);
  }
}
