import { describe, expect, it } from "vitest";
import { refractionAt } from "../../src/refraction.js";

describe("refractionAt", () => {
  it("returns the 34.5′ floor below the first table row", () => {
    expect(refractionAt(-2)).toBe(34.5 / 60);
    expect(refractionAt(-0.5833333333333334)).toBe(34.5 / 60);
  });

  it("returns a row value exactly at its altitude", () => {
    expect(refractionAt(-0.5166666666666667)).toBeCloseTo(33.8 / 60, 12);
  });

  it("linearly interpolates between adjacent rows", () => {
    const lo = -0.5833333333333334;
    const hi = -0.5166666666666667;
    expect(refractionAt((lo + hi) / 2)).toBeCloseTo((34.5 + 33.8) / 2 / 60, 12);
  });

  it("returns ~0 refraction at and above the last table row", () => {
    expect(refractionAt(90)).toBe(0);
  });
});