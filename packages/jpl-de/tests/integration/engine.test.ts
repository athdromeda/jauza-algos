import { describe, it, expect } from "vitest";
import { CspiceEngine } from "../../src/engine.js";

describe("CspiceEngine against the real CDN + DE440", () => {
  it("computes Sun and Moon (J2000, geometric) for 1992-10-13 from the CDN", async () => {
    const engine = new CspiceEngine();
    const ready = engine.start("de440-slim");
    expect(engine.start("de440-slim")).toBe(ready);
    await ready;
    expect(engine.isReady()).toBe(true);

    const sun = engine.computeSun(2448908.5);
    const moon = engine.computeMoon(2448908.5);

    expect(sun.lambda).toBeCloseTo(198.47417, 2);
    expect(sun.beta).toBeCloseTo(-7.82271, 2);
    expect(sun.r).toBeGreaterThan(148e6);
    expect(sun.r).toBeLessThan(150.5e6);

    expect(moon.lambda).toBeCloseTo(30.7947, 1);
    expect(moon.beta).toBeCloseTo(16.58518, 1);
    expect(moon.r).toBeGreaterThan(385e3);
    expect(moon.r).toBeLessThan(402e3);
  }, 300_000);
});