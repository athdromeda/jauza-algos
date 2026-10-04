import { describe, it, expect } from "vitest";
import { CspiceEngine } from "../../src/engine.js";

const separationDeg = (
  a: { lambda: number; beta: number },
  b: { lambda: number; beta: number },
): number => {
  const r1 = (a.lambda * Math.PI) / 180;
  const d1 = (a.beta * Math.PI) / 180;
  const r2 = (b.lambda * Math.PI) / 180;
  const d2 = (b.beta * Math.PI) / 180;
  const c =
    Math.sin(d1) * Math.sin(d2) +
    Math.cos(d1) * Math.cos(d2) * Math.cos(r1 - r2);
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
};

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

  it("returns a CN+S apparent state distinct from the geometric NONE state", async () => {
    const engine = new CspiceEngine();
    await engine.start("de440-slim");

    const jd = 2448908.5;

    const sunGeo = engine.computeSun(jd, "NONE");
    const sunApp = engine.computeSun(jd, "CN+S");
    const moonGeo = engine.computeMoon(jd, "NONE");
    const moonApp = engine.computeMoon(jd, "CN+S");

    // Default aberration flag is the geometric source.
    expect(engine.computeSun(jd)).toEqual(sunGeo);
    expect(engine.computeMoon(jd)).toEqual(moonGeo);

    // Aberration dominates: ~20.5 arcsec (~0.0057 deg) for the Sun; the Moon
    // shares the same aberration but has a much smaller light-time offset.
    const sunSep = separationDeg(sunGeo, sunApp);
    const moonSep = separationDeg(moonGeo, moonApp);
    expect(sunSep).toBeGreaterThan(0.001);
    expect(sunSep).toBeLessThan(0.02);
    expect(moonSep).toBeGreaterThan(0.00002);
    expect(moonSep).toBeLessThan(0.02);

    // Distances remain finite and are perturbed by light-time.
    expect(Number.isFinite(sunApp.r)).toBe(true);
    expect(Number.isFinite(moonApp.r)).toBe(true);
    expect(Math.abs(sunApp.r - sunGeo.r)).toBeLessThan(50);
    expect(Math.abs(moonApp.r - moonGeo.r)).toBeLessThan(50);
    expect(Math.abs(moonApp.r - moonGeo.r)).toBeGreaterThan(0);
  }, 300_000);
});
