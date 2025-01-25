import { describe, it, expect, beforeAll } from 'vitest';
import {
  awaitReady,
  BetaDistributionParams,
  normalApproxBetaALtB,
  monteCarloBetaALtB,
  summationBetaALtB,
  integralBetaALtB,
} from '../src';

beforeAll(async () => {
  // Call awaitReady before running tests
  await awaitReady();
});

function expectClosePVals(
  pVal1: number | undefined,
  pVal2: number | undefined,
  tolerance: number = 0.001
) {
  expect(pVal1).toBeDefined();
  expect(pVal2).toBeDefined();
  if (pVal1 !== undefined && pVal2 !== undefined) {
    expect(Math.abs(pVal1 - pVal2)).toBeLessThan(tolerance);
  }
}

describe('BetaDistributionPValues', () => {
  it('No delta 4-way comparison', async () => {
    const numPositiveSamplesA = 50;
    const numNegativeSamplesA = 35;
    const numPositiveSamplesB = 45;
    const numNegativeSamplesB = 40;
    const distA: BetaDistributionParams = {
      a: numPositiveSamplesA + 1,
      b: numNegativeSamplesA + 1,
    };
    const distB: BetaDistributionParams = {
      a: numPositiveSamplesB + 1,
      b: numNegativeSamplesB + 1,
    };
    const pValALtBNormal = normalApproxBetaALtB({
      A: distA,
      B: distB,
    });
    // More samples than the default to be within the 0.1% tolerance
    const pValALtBMonteCarlo = monteCarloBetaALtB({ A: distA, B: distB, samples: 1_000_000 });
    const pValBLtASummation = summationBetaALtB({ A: distA, B: distB });
    const pValBLtAIntegral = integralBetaALtB({ A: distA, B: distB });
    console.log('pValALtBNormal', pValALtBNormal);
    console.log('pValALtBMonteCarlo', pValALtBMonteCarlo);
    console.log('pValBLtASummation', pValBLtASummation);
    console.log('pValBLtAIntegral', pValBLtAIntegral);
    expectClosePVals(pValALtBNormal, pValALtBMonteCarlo);
    expectClosePVals(pValALtBNormal, pValBLtASummation);
    expectClosePVals(pValALtBNormal, pValBLtAIntegral);
  });
});
