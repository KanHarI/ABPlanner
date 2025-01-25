import { describe, it, expect } from "vitest";
import {awaitReady, normalApproxBetaALtB} from "../src";

describe("normalApproxBetaALtB", () => {
  it("should return a probability for valid inputs", async () => {
    await awaitReady();
    const A = { a: 3, b: 5 };
    const B = { a: 2, b: 6 };
    const result = normalApproxBetaALtB({ A, B });

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });
});
