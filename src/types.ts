export type DeltaType = 'constant' | 'relative' | 'logit';

export interface BetaDistributionParams {
  a: number;
  b: number;
}

export interface Delta {
  type: DeltaType;
  value: number;
}

export interface NumericalIntegrationParams {
  A: BetaDistributionParams;
  B: BetaDistributionParams;
  delta?: Delta;
  steps?: number;
}
