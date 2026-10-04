import { describe, it, expect } from "vitest";
import type { GeocentricEcliptic } from "@jauza/core";
import { jplDe } from "../../src/index.js";

describe("jplDe through the real CDN + DE440", () => {
  it("loads de440-slim, waits for ready, and computes positions for 1992-10-13", async () => {
    const cfg = jplDe.load("de440-slim");
    await jplDe.ready;

    const sun = cfg.SUN!.formula({ jd: 2448908.5 }) as GeocentricEcliptic;
    expect(sun.lambda).toBeCloseTo(198.47417, 2);
    expect(sun.beta).toBeCloseTo(-7.82271, 2);
    expect(sun.r).toBeGreaterThan(148e6);

    const moon = cfg.MOON!.formula({ jd: 2448908.5 }) as GeocentricEcliptic;
    expect(moon.lambda).toBeCloseTo(30.7947, 1);
    expect(moon.beta).toBeCloseTo(16.58518, 1);
    expect(moon.r).toBeGreaterThan(385e3);
  }, 300_000);
});