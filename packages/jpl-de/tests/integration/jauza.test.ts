import { describe, it, expect } from "vitest";
import { Earth, Moon, Sun, Time } from "@jauza/core";
import { jplDe } from "../../src/index.js";

// 1992-10-13 00:00 UT — the reference cell used across the CDN engine tests.
// The resolver canonicalizes EQUATORIAL J2000 output to ecliptic/equatorial of
// date, so RA/Dec of date sit ~0.1° from the J2000 cells (1992 is ~7.6 yr from
// J2000; precession ~50″/yr). Measured DSL deviations: RA ≤ 0.1°, Dec ≤ 0.04°.
const REF_SUN_RA = 198.47417;
const REF_SUN_DEC = -7.82271;
const REF_MOON_RA = 30.7947;
const REF_MOON_DEC = 16.58518;
const RA_TOL_DEG = 0.15;
const DEC_TOL_DEG = 0.15;

const observerAt1992 = (cfg: ReturnType<typeof jplDe.load>) =>
  new Earth(0, 0, 0).at(new Time(1992, 10, 13, 0)).with(cfg);

const wrap = (deg: number) => ((deg % 360) + 360) % 360;

describe("jplDe through the @jauza/core DSL", () => {
  it("observes Sun and Moon at 1992-10-13 with de440-slim", async () => {
    const cfg = jplDe.load("de440-slim");
    await jplDe.ready;

    // `observe()` returns the shared observer, so snapshot each body before
    // switching the target.
    const sun = observerAt1992(cfg).observe(Sun);
    const sunR = sun.r;
    const sunRa = wrap(sun.geometric().ra.decimal);
    const sunDec = sun.geometric().dec.decimal;

    const moon = observerAt1992(cfg).observe(Moon);
    const moonR = moon.r;
    const moonRa = wrap(moon.geometric().ra.decimal);
    const moonDec = moon.geometric().dec.decimal;

    // Distances are frame-invariant and must match the engine cells in km.
    expect(sunR).toBeGreaterThan(148e6);
    expect(sunR).toBeLessThan(150.5e6);
    expect(moonR).toBeGreaterThan(385e3);
    expect(moonR).toBeLessThan(402e3);

    // RA/Dec of date vs the J2000 reference cells (precession offset, wrapped).
    expect(Math.abs(sunRa - REF_SUN_RA)).toBeLessThan(RA_TOL_DEG);
    expect(Math.abs(sunDec - REF_SUN_DEC)).toBeLessThan(DEC_TOL_DEG);
    expect(Math.abs(moonRa - REF_MOON_RA)).toBeLessThan(RA_TOL_DEG);
    expect(Math.abs(moonDec - REF_MOON_DEC)).toBeLessThan(DEC_TOL_DEG);
  }, 300_000);
});