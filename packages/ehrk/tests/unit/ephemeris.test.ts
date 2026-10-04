import { describe, expect, it } from "vitest";
import { meanEclipticOfDate } from "@jauza/core/position";
import {
  ARCSEC_PER_DEG,
  R_EARTH_KM,
  createEphemeris,
  moonRow,
  sunRow,
} from "../../src/ephemeris.js";
import { moon as moonRows, sun as sunRows } from "../../src/data.js";
import type { EhrkSeries } from "../../src/series.js";

const FIRST_JD = 2456658.5;
const SERIES_2026_FROM = 2461041.5;

describe("sunRow", () => {
  it("reproduces a row exactly when jd hits it", () => {
    const [jd, lon, lat, , , distAu, , obliquity] = sunRows[1000]!;
    const got = sunRow(jd);
    expect(got.distanceAu).toBe(distAu);
    expect(got.lonDeg).toBeCloseTo(lon / ARCSEC_PER_DEG, 8);
    expect(got.latDeg).toBeCloseTo(lat / ARCSEC_PER_DEG, 8);
    expect(got.epsilonDeg).toBeCloseTo(obliquity / ARCSEC_PER_DEG, 8);
  });

  it("linearly interpolates exactly halfway between adjacent rows", () => {
    const lo = sunRows[0]!;
    const hi = sunRows[1]!;
    const mid = (lo[0] + hi[0]) / 2;
    const got = sunRow(mid);
    expect(got.distanceAu).toBeCloseTo((lo[5] + hi[5]) / 2, 8);
    expect(got.lonDeg).toBeCloseTo(((lo[1] + hi[1]) / 2) / ARCSEC_PER_DEG, 7);
  });

  it("interpolates longitude correctly mid-hour (wrap guard is defensive; hourly lon steps are far below 180°)", () => {
    const lo = sunRows[1000]!;
    const hi = sunRows[1001]!;
    const quarter = lo[0] + (hi[0] - lo[0]) * 0.25;
    const got = sunRow(quarter);
    const expected = (lo[1] + (hi[1] - lo[1]) * 0.25) / ARCSEC_PER_DEG;
    expect(Math.abs(got.lonDeg - expected) % 360).toBeCloseTo(0, 4);
  });

  it("extrapolates the final pre-2026 hour from the older series' final two rows", () => {
    const boundaryIndex = sunRows.findIndex(
      ([jd]) => jd === SERIES_2026_FROM,
    );
    const lo = sunRows[boundaryIndex - 2]!;
    const hi = sunRows[boundaryIndex - 1]!;
    const jd = SERIES_2026_FROM - 1 / 48;
    const t = (jd - lo[0]) / (hi[0] - lo[0]);
    const expectedLongitude = (lo[1] + t * (hi[1] - lo[1])) / ARCSEC_PER_DEG;
    const expectedDistance = lo[5] + t * (hi[5] - lo[5]);

    const got = sunRow(jd);

    expect(got.lonDeg).toBeCloseTo(expectedLongitude, 8);
    expect(got.distanceAu).toBeCloseTo(expectedDistance, 10);
  });

  it("throws RangeError below and above the table range", () => {
    expect(() => sunRow(FIRST_JD - 0.001)).toThrow(RangeError);
    expect(() => sunRow(2461406.5 + 0.001)).toThrow(RangeError);
  });

  it("throws for jd inside a data gap, but accepts the exact gap-boundary rows", () => {
    expect(() => sunRow(2457100)).toThrowError(/gap/i);
    expect(() => sunRow(2457300)).toThrowError(/gap/i);
    expect(() => sunRow(2457023.5)).not.toThrow();
    expect(() => sunRow(2457754.5)).not.toThrow();
    expect(() => sunRow(2460500)).not.toThrow();
  });
});

describe("moonRow", () => {
  it("reproduces a row exactly when jd hits it", () => {
    const [jd, lon, lat, , , parallax] = moonRows[1000]!;
    const got = moonRow(jd);
    expect(got.lonDeg).toBeCloseTo(lon / ARCSEC_PER_DEG, 8);
    expect(got.latDeg).toBeCloseTo(lat / ARCSEC_PER_DEG, 8);
    expect(got.distanceKm).toBeCloseTo(
      R_EARTH_KM / Math.sin((parallax / ARCSEC_PER_DEG) * (Math.PI / 180)),
      6,
    );
  });

  it("throws for jd inside a data gap", () => {
    expect(() => moonRow(2457300)).toThrowError(/gap/i);
  });
});

function tinySeries(): EhrkSeries {
  const sunRows = [
    [100, 3600, 0, 7200, 0, 1, 100, 84360, 0],
    [100.5, 7200, 0, 10800, 0, 2, 100, 84360, 0],
  ] as const;
  const moonRows = [
    [100, 3600, 0, 7200, 0, 3600, 100, 0, 0],
    [100.5, 7200, 0, 10800, 0, 3600, 100, 0, 0],
  ] as const;
  return {
    id: "tiny",
    validity: { from: 100, to: 100.5 },
    sun: sunRows,
    moon: moonRows,
    sunCoordinates: { ecliptic: meanEclipticOfDate, equatorial: meanEclipticOfDate },
    moonCoordinates: { ecliptic: meanEclipticOfDate, equatorial: meanEclipticOfDate },
  };
}

describe("createEphemeris", () => {
  it("samples the series' own rows", () => {
    const eph = createEphemeris(tinySeries());
    const exact = eph.sunRow(100);
    expect(exact.lonDeg).toBeCloseTo(1, 10);
    expect(exact.distanceAu).toBe(1);
    const mid = eph.sunRow(100.25);
    expect(mid.distanceAu).toBeCloseTo(1.5, 10);
  });

  it("enforces the series' own range", () => {
    const eph = createEphemeris(tinySeries());
    expect(() => eph.sunRow(99)).toThrow(RangeError);
    expect(() => eph.sunRow(101)).toThrow(RangeError);
  });
});
