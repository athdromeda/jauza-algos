import { describe, it, expect } from "vitest";
import { Earth, Sun, Time } from "@jauza/core";
import type { GeocentricEcliptic } from "@jauza/core";
import { jplDe } from "../../src/index.js";

const wrap = (deg: number) => ((deg % 360) + 360) % 360;
/** Signed angular difference a - b in (-180, 180]. */
const angleDiff = (a: number, b: number) => wrap(a - b + 180) - 180;

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

  it("publishes an apparent source and declares only its true corrections", async () => {
    const cfg = jplDe.load("de440-slim");
    await jplDe.ready;

    expect(cfg.metadata.corrections).toEqual([
      "light-time",
      "stellar-aberration",
    ]);
    expect(cfg.metadata.corrections).not.toContain("solar-deflection");

    const jd = 2448908.5;
    const geo = cfg.SUN!.formula({ jd }) as GeocentricEcliptic;
    const app = cfg.SUN!.apparentFormula!({ jd }) as GeocentricEcliptic;

    // Apparent longitude leads the geometric by the aberration ~20.5 arcsec.
    const lonShift = Math.abs(angleDiff(app.lambda, geo.lambda));
    expect(lonShift).toBeGreaterThan(0.001);
    expect(lonShift).toBeLessThan(0.02);
  }, 300_000);

  it("exposes apparent Sun/Moon coordinates and topocentric altitude via the DSL", async () => {
    const cfg = jplDe.load("de440-slim");
    await jplDe.ready;

    const observer = () =>
      new Earth(-6.166667, 106.816667, 0).at(new Time(1992, 10, 13, 0));

    const sun = observer().with(cfg).observe(Sun);
    const geometricRa = wrap(sun.geometric().ra.decimal);
    const apparentRa = wrap(sun.ra.decimal);
    const apparentDec = sun.dec.decimal;

    expect(Number.isFinite(apparentRa)).toBe(true);
    expect(Number.isFinite(apparentDec)).toBe(true);
    expect(Number.isFinite(sun.alt)).toBe(true);
    // Apparent RA is a distinct, small-shift correction of the geometric value.
    expect(Math.abs(angleDiff(apparentRa, geometricRa))).toBeGreaterThan(0.0005);
    expect(Math.abs(angleDiff(apparentRa, geometricRa))).toBeLessThan(0.05);
  }, 300_000);
});
