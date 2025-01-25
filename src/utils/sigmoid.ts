export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function inverseSigmoid(x: number): number {
  return Math.log(x / (1 - x));
}
