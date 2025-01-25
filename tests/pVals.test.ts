import { describe, it, expect, beforeAll } from 'vitest';
import {
  awaitReady,
  BetaDistributionParams,
  normalApproxBetaALtB,
  monteCarloBetaALtB,
  summationBetaALtB,
  integralBetaALtB,
  Delta,
} from '../src';

beforeAll(async () => {
  // Call awaitReady before running tests
  await awaitReady();
});

function expectClosePVals(
  pVal1: number | undefined,
  pVal2: number | undefined,
  tolerance: number = 0.002
) {
  expect(pVal1).toBeDefined();
  expect(pVal2).toBeDefined();
  if (pVal1 !== undefined && pVal2 !== undefined) {
    expect(Math.abs(pVal1 - pVal2)).toBeLessThan(tolerance);
  }
}

describe('BetaDistributionPValues', () => {
  it('No delta 4-way comparison', () => {
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
    // More samples than the default to be within the 0.2% tolerance
    const pValALtBMonteCarlo = monteCarloBetaALtB({
      A: distA,
      B: distB,
      samples: 400_000,
    });
    const pValALtBSummation = summationBetaALtB({ A: distA, B: distB });
    const pValALtBIntegral = integralBetaALtB({ A: distA, B: distB });
    console.log('pValALtBNormal', pValALtBNormal);
    console.log('pValALtBMonteCarlo', pValALtBMonteCarlo);
    console.log('pValALtBSummation', pValALtBSummation);
    console.log('pValALtBIntegral', pValALtBIntegral);
    expectClosePVals(pValALtBNormal, pValALtBMonteCarlo);
    expectClosePVals(pValALtBNormal, pValALtBSummation);
    expectClosePVals(pValALtBNormal, pValALtBIntegral);
    expectClosePVals(pValALtBNormal, 0.2213);
  });

  it('Constant delta 3-way comparison', () => {
    const numPositiveSamplesA = 40;
    const numNegativeSamplesA = 45;
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
    const delta: Delta = { type: 'constant', value: 0.1 };
    const pValALtBNormal = normalApproxBetaALtB({
      A: distA,
      B: distB,
      delta,
    });
    const pValALtBMonteCarlo = monteCarloBetaALtB({
      A: distA,
      B: distB,
      delta,
      samples: 400_000,
    });
    const pValALtBIntegral = integralBetaALtB({ A: distA, B: distB, delta });
    console.log('pValALtBNormal', pValALtBNormal);
    console.log('pValALtBMonteCarlo', pValALtBMonteCarlo);
    console.log('pValALtBIntegral', pValALtBIntegral);
    expectClosePVals(pValALtBNormal, pValALtBMonteCarlo);
    expectClosePVals(pValALtBNormal, pValALtBIntegral);
    expectClosePVals(pValALtBNormal, 0.286);
  });

  it('Relative delta 3-way comparison', () => {
    const numPositiveSamplesA = 40;
    const numNegativeSamplesA = 45;
    const numPositiveSamplesB = 45;
    const numNegativeSamplesB = 45;
    const distA: BetaDistributionParams = {
      a: numPositiveSamplesA + 1,
      b: numNegativeSamplesA + 1,
    };
    const distB: BetaDistributionParams = {
      a: numPositiveSamplesB + 1,
      b: numNegativeSamplesB + 1,
    };
    const delta: Delta = { type: 'relative', value: 0.1 };
    const pValALtBNormal = normalApproxBetaALtB({
      A: distA,
      B: distB,
      delta,
    });
    const pValALtBMonteCarlo = monteCarloBetaALtB({
      A: distA,
      B: distB,
      delta,
      samples: 400_000,
    });
    const pValALtBIntegral = integralBetaALtB({ A: distA, B: distB, delta });
    console.log('pValALtBNormal', pValALtBNormal);
    console.log('pValALtBMonteCarlo', pValALtBMonteCarlo);
    console.log('pValALtBIntegral', pValALtBIntegral);
    expectClosePVals(pValALtBNormal, pValALtBMonteCarlo);
    expectClosePVals(pValALtBNormal, pValALtBIntegral);
    expectClosePVals(pValALtBNormal, 0.408);
  });
});
