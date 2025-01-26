import {beforeAll, describe, expect, it} from "vitest";
import {awaitReady} from "../src";
import {runExperimentsFindConfidenceAndPower} from "../src/verifyConfidenceAndPower";

beforeAll(async () => {
  // Call awaitReady before running tests
  await awaitReady();
});

describe("Test confidence and power", () => {
  const alphas = [0.1]; // [0.2, 0.1, 0.05, 0.01];
  const sampleSizes = [100]; // [10, 20, 50, 100, 200, 500, 1000];
  alphas.forEach((alpha) => {
    sampleSizes.forEach((sampleSize) => {
      it(`Run 1000 experiments, alpha=${alpha}, sampleSize=${sampleSize}`, () => {
        const report = runExperimentsFindConfidenceAndPower({
          NExperiments: 1000,
          NPerExperiment: sampleSize,
          significance: alpha,
        });
        console.log(report);
        expect(report.EmpiricalPValue).toBeLessThan(alpha);
      });
    });
  });
})
