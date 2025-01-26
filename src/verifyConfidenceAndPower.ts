import { Delta } from './types';
import { naiveBinomialSample, optimizedBinomialSample } from './utils/binomial';
import { integralBetaALtB } from './utils/integration';
import { normalApproxBetaALtB } from './utils/normalBetaApproximation';
import { summationBetaALtB } from './utils/summation';
import { monteCarloBetaALtB } from './utils/monteCarlo';
import { inverseSigmoid, sigmoid } from './utils/sigmoid';

export interface ExperimentReport {
  NExperiments: number;
  NTruePositives: number;
  NFalsePositives: number;
  NTrueNegatives: number;
  NFalseNegatives: number;
  EmpiricalConfidence: number;
  EmpiricalPValue: number;
  EmpiricalPower: number;
  HypothesizedFalsePositives: number;
}

export function runExperimentsFindConfidenceAndPower(parameters: {
  NExperiments: number;
  NPerExperiment: number;
  significance: number; // alpha
  delta?: Delta;
  binomialType?: 'naive' | 'optimized';
  comparisonMethod?:
    | 'normalApprox'
    | 'summation'
    | 'integration'
    | 'monteCarlo';
}) {
  const report: ExperimentReport = {
    NExperiments: parameters.NExperiments,
    NTruePositives: 0,
    NFalsePositives: 0,
    NTrueNegatives: 0,
    NFalseNegatives: 0,
    EmpiricalConfidence: 0,
    EmpiricalPValue: 0,
    EmpiricalPower: 0,
    HypothesizedFalsePositives: 0,
  };
  if (
    parameters.delta !== undefined &&
    parameters.comparisonMethod !== undefined
  ) {
    if (parameters.comparisonMethod === 'summation') {
      throw new Error('Summation method does not support delta adjustments');
    }
    if (
      parameters.comparisonMethod === 'normalApprox' &&
      parameters.delta.type === 'logit'
    ) {
      throw new Error(
        'Normal approximation method does not support logit delta adjustments'
      );
    }
  }
  const binomialCallback =
    parameters.binomialType === 'naive'
      ? naiveBinomialSample
      : optimizedBinomialSample;
  let betaALtBCallback: typeof integralBetaALtB | undefined = undefined;
  switch (
    parameters.comparisonMethod ??
    (parameters.delta ? 'integration' : 'summation')
  ) {
    case 'normalApprox':
      betaALtBCallback = normalApproxBetaALtB;
      break;
    case 'integration':
      betaALtBCallback = integralBetaALtB;
      break;
    case 'summation':
      betaALtBCallback = summationBetaALtB;
      break;
    case 'monteCarlo':
      betaALtBCallback = monteCarloBetaALtB;
      break;
  }
  if (betaALtBCallback === undefined) {
    throw new Error('Invalid comparison method');
  }
  let hypothesizedFPs = 0;
  for (
    let experimentCounter = 0;
    experimentCounter < parameters.NExperiments;
    ++experimentCounter
  ) {
    const Pa = Math.random();
    const Pb = Math.random();
    let minPbGT = Pa;
    if (parameters.delta) {
      switch (parameters.delta.type) {
        case 'constant':
          minPbGT += parameters.delta.value;
          break;
        case 'relative':
          minPbGT *= 1 + parameters.delta.value;
          break;
        case 'logit':
          minPbGT = sigmoid(inverseSigmoid(Pa) + parameters.delta.value);
          break;
        default:
          throw new Error('Unknown delta type');
      }
    }
    const groundTruthIsPositive = Pb > minPbGT;
    const NaPositive = binomialCallback(Pa, parameters.NPerExperiment);
    const NaNegative = parameters.NPerExperiment - NaPositive;
    const NbPositive = binomialCallback(Pb, parameters.NPerExperiment);
    const NbNegative = parameters.NPerExperiment - NbPositive;
    const distA = { a: NaPositive + 1, b: NaNegative + 1 };
    const distB = { a: NbPositive + 1, b: NbNegative + 1 };
    const pVal = betaALtBCallback({
      A: distA,
      B: distB,
      delta: parameters.delta,
    });
    if (pVal === undefined) {
      throw new Error('Error during comparison');
    }
    const observedIsPositive = 1 - pVal < parameters.significance;
    if (observedIsPositive) {
      hypothesizedFPs += 1 - pVal;
      if (groundTruthIsPositive) {
        ++report.NTruePositives;
      } else {
        ++report.NFalsePositives;
      }
    } else {
      if (groundTruthIsPositive) {
        ++report.NFalseNegatives;
      } else {
        ++report.NTrueNegatives;
      }
    }
  }
  report.EmpiricalPValue =
    report.NFalsePositives / (report.NFalsePositives + report.NTruePositives);
  report.EmpiricalConfidence = 1 - report.EmpiricalPValue;
  report.EmpiricalPower =
    report.NTruePositives / (report.NTruePositives + report.NFalseNegatives);
  report.HypothesizedFalsePositives = hypothesizedFPs;
  return report;
}
