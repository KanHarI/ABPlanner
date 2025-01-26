// eslint-disable-next-line @typescript-eslint/no-require-imports
const cephes = require('cephes');

export function naiveBinomialSample(p: number, n: number): number {
  let successes = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < p) {
      successes++;
    }
  }
  return successes;
}

/**
 * Generates a random variate X ~ Binomial(n, p).
 * Decides between an "inversion" method and a "BTPE" method
 * based on the threshold n * p <= 30, mirroring NumPy's approach.
 *
 * @param n - Number of Bernoulli trials (n ≥ 0)
 * @param p - Probability of success in each trial (0 ≤ p ≤ 1)
 * @returns A sample from the Binomial(n, p) distribution (integer)
 */
export function optimizedBinomialSample(p: number, n: number): number {
  if (n === 0) {
    return 0;
  }
  if (p <= 0) {
    return 0;
  }
  if (p >= 1) {
    return n;
  }

  // If p <= 0.5, sample directly. Otherwise, reflect using q = 1 - p.
  if (p <= 0.5) {
    if (n * p <= 30) {
      return binomialInversion(n, p);
    } else {
      return binomialBTPE(n, p);
    }
  } else {
    // For p > 0.5, use q=1-p and reflect
    const q = 1 - p;
    let x: number;
    if (n * q <= 30) {
      x = binomialInversion(n, q);
    } else {
      x = binomialBTPE(n, q);
    }
    // Binomial(n, p) ~ n - Binomial(n, 1-p), ensure integer:
    return Math.floor(n - x);
  }
}

/**
 * The "inversion" method, used for smaller n*p (or n*(1-p)).
 * Adapted from NumPy's `random_binomial_inversion`.
 *
 * @param n - Number of trials
 * @param p - Probability of success per trial
 * @returns Binomial variate (integer in [0, n])
 */
function binomialInversion(n: number, p: number): number {
  const q = 1 - p;

  // Probability of X=0 is q^n
  const qn = Math.exp(n * Math.log(q));
  let x = 0;
  let px = qn; // pmf at x=0
  let u = Math.random();

  while (u > px) {
    u -= px;
    x += 1;
    // Recurrence for pmf ratio in the binomial:
    //   P(X=x) = P(X=x-1) * ((n - x + 1) * p) / (x * q)
    px *= ((n - x + 1) * p) / (x * q);

    // Edge case if floating error accumulates:
    if (x > n) {
      return n;
    }
  }

  return x; // x is already an integer
}

/**
 * The BTPE (Bins, Triangles, Parallelograms, Exponential) method,
 * used for larger n*p. Adapted from NumPy's `random_binomial_btpe`.
 *
 * @param n - Number of trials
 * @param p - Probability of success per trial
 * @returns Binomial variate (integer in [0, n])
 */
function binomialBTPE(n: number, p: number): number {
  const q = 1 - p;
  const r = Math.min(p, q);
  const np = n * r;

  // fm = n*r + r
  const fm = np + r;
  const m = Math.floor(fm);

  // p1 is the boundary of the "triangle" region
  const p1 = Math.floor(2.195 * Math.sqrt(np * q) - 4.6 * q) + 0.5;
  const xm = m + 0.5;
  const xl = xm - p1;
  const xr = xm + p1;

  // c used in region tests
  const c = 0.134 + 20.5 / (15.3 + m);

  // laml for left tail
  let a = fm - xl;
  a = a / (fm - xl * r);
  const laml = a * (1 + a / 2);

  // lamr for right tail
  a = xr - fm;
  a = a / (xr * q);
  const lamr = a * (1 + a / 2);

  const p2 = p1 * (1 + 2 * c);
  const p3 = p2 + c / laml;
  const p4 = p3 + c / lamr;

  while (true) {
    const u = Math.random() * p4;
    const v = Math.random();

    // Region 1: (0 <= u <= p1)
    if (u <= p1) {
      // integer by floor
      const x = Math.floor(xm - p1 * v + u);
      return clampToBounds(x, n);
    }

    // Region 2: (p1 < u <= p2)
    if (u <= p2) {
      const xf = xl + (u - p1) / c; // float
      if (v <= 1 - Math.abs(m - xf + 0.5) / p1) {
        return clampToBounds(Math.floor(xf), n);
      }
      continue;
    }

    // Region 3: (p2 < u <= p3)  -- left exponential tail
    if (u <= p3) {
      const x = Math.floor(xl + Math.log(v) / laml);
      if (x < 0) {
        continue; // reject
      }
      const us = (u - p2) * laml;
      if (testFinalAcceptance(x, m, n, p, v, us)) {
        return clampToBounds(x, n);
      }
      continue;
    }

    // Region 4: (p3 < u <= p4)  -- right exponential tail
    {
      const x = Math.floor(xr - Math.log(v) / lamr);
      if (x > n) {
        continue; // reject
      }
      const us = (u - p3) * lamr;
      if (testFinalAcceptance(x, m, n, p, v, us)) {
        return clampToBounds(x, n);
      }
    }
  }
}

/**
 * Final acceptance check for candidates in the exponential "tails",
 * based on a ratio-of-pmfs test (NumPy "step52").
 *
 * @param x - Candidate outcome
 * @param m - Floor of the mean (internal usage)
 * @param n - Total number of trials
 * @param p - Success probability
 * @param v - Uniform random variable (for acceptance test)
 * @param us - A scaling factor used in the step
 * @returns Whether x is accepted
 */
function testFinalAcceptance(
  x: number,
  m: number,
  n: number,
  p: number,
  v: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  us: number
): boolean {
  // We'll do a direct ratio-of-likelihood approach:
  //   log(V) vs. log( pmf(x) / pmf(m) ).
  const logV = Math.log(v);

  // log( pmf(x)/pmf(m) ) in binomial is:
  //   (x - m)*log(p/(1-p)) + [lgam(m+1)+lgam(n-m+1)] - [lgam(x+1)+lgam(n-x+1)]
  const logRatio =
    (x - m) * Math.log(p / (1 - p)) +
    logGamma(m + 1) +
    logGamma(n - m + 1) -
    (logGamma(x + 1) + logGamma(n - x + 1));

  return logV <= logRatio;
}

/**
 * Light utility to ensure we don't return a value outside [0, n],
 * plus a final floor to guarantee an integer.
 * (Usually not needed if the logic is correct, but it's a nice safety check.)
 */
function clampToBounds(x: number, n: number): number {
  if (x < 0) return 0;
  if (x > n) return n;
  // Return an integer
  return x;
}

function logGamma(x: number): number {
  return cephes.lgam(x);
}
