import { describe, expect, it } from "vitest";
import type { MultiCoordinateOutput } from "@jauza/core";
import {
  meanEclipticOfDate,
  meanEquatorialOfDate,
  toPosition,
  trueEclipticOfDate,
  trueEquatorialOfDate,
} from "@jauza/core/position";
import { moon, sun } from "../../src/data.js";
import { moonRow, sunRow } from "../../src/ephemeris.js";
import { createSunFormula, ehrk } from "../../src/index.js";
import { createSeriesRouter, type EhrkSeries } from "../../src/series.js";

const FIRST_JD = 2456658.5;
const SERIES_2026_FROM = 2461041.5;

const sunOut = (jd: number) =>
  ehrk.SUN!.formula({ jd }) as MultiCoordinateOutput;
const moonOut = (jd: number) =>
  ehrk.MOON!.formula({ jd }) as MultiCoordinateOutput;

describe("ehrk algo contract", () => {
  it("declares SUN as mean and MOON as true earth-origin ecliptic-of-date", () => {
    const sunCfg = ehrk.SUN!;
    const moonCfg = ehrk.MOON!;
    expect(ehrk.bodies).toEqual(["SUN", "MOON"]);
    expect(toPosition(sunCfg.formula({ jd: FIRST_JD }), sunCfg).origin).toBe("earth");
    expect(toPosition(sunCfg.formula({ jd: FIRST_JD }), sunCfg).system).toBe("ecliptic");
    expect(toPosition(sunCfg.formula({ jd: FIRST_JD }), sunCfg).reference).toEqual(meanEclipticOfDate);
    expect(toPosition(moonCfg.formula({ jd: FIRST_JD }), moonCfg).origin).toBe("earth");
    expect(toPosition(moonCfg.formula({ jd: FIRST_JD }), moonCfg).system).toBe("ecliptic");
    expect(toPosition(moonCfg.formula({ jd: FIRST_JD }), moonCfg).reference).toEqual(trueEclipticOfDate);
  });

  it("publishes the Sun's mean ecliptic and true equatorial table coordinates", () => {
    const row = sunRow(FIRST_JD);
    const out = sunOut(FIRST_JD);
    expect(out.primary).toEqual({
      system: "ecliptic",
      reference: meanEclipticOfDate,
    });
    expect(out.coordinates).toEqual([
      {
        system: "ecliptic",
        reference: meanEclipticOfDate,
        longitude: row.lonDeg,
        latitude: row.latDeg,
      },
      {
        system: "equatorial",
        reference: trueEquatorialOfDate,
        longitude: row.raDeg,
        latitude: row.decDeg,
      },
    ]);
    expect(out.r).toBe(row.distanceAu);
  });

  it("publishes 2026 Sun ecliptic coordinates as true-of-date", () => {
    const before = sunOut(SERIES_2026_FROM - 1 / 86400);
    const atBoundary = sunOut(SERIES_2026_FROM);

    expect(before.primary.reference).toEqual(meanEclipticOfDate);
    expect(before.coordinates[0]!.reference).toEqual(meanEclipticOfDate);
    expect(atBoundary.primary.reference).toEqual(trueEclipticOfDate);
    expect(atBoundary.coordinates[0]!.reference).toEqual(trueEclipticOfDate);
  });

  it("publishes the Moon's true ecliptic and true equatorial table coordinates", () => {
    const row = moonRow(FIRST_JD);
    const out = moonOut(FIRST_JD);
    expect(out.primary).toEqual({
      system: "ecliptic",
      reference: trueEclipticOfDate,
    });
    expect(out.coordinates[0]).toEqual({
      system: "ecliptic",
      reference: trueEclipticOfDate,
      longitude: row.lonDeg,
      latitude: row.latDeg,
    });
    expect(out.coordinates[1]).toEqual({
      system: "equatorial",
      reference: trueEquatorialOfDate,
      longitude: row.raDeg,
      latitude: row.decDeg,
    });
  });

  it("sun formula returns the interpolated table row", () => {
    const [jd, lon, lat, , , distAu] = sun[1000]!;
    const out = sunOut(jd);
    expect(out.coordinates[0]!.longitude).toBeCloseTo(lon / 3600, 8);
    expect(out.coordinates[0]!.latitude).toBeCloseTo(lat / 3600, 8);
    expect(out.r).toBe(distAu);
  });

  it("moon formula returns interpolated longitude/latitude and parallax-derived distance", () => {
    const [jd, lon, lat, , , parallax] = moon[1000]!;
    const out = moonOut(jd);
    expect(out.coordinates[0]!.longitude).toBeCloseTo(lon / 3600, 8);
    expect(out.coordinates[0]!.latitude).toBeCloseTo(lat / 3600, 8);
    expect(out.r).toBeCloseTo(
      6378.137 / Math.sin((parallax / 3600) * (Math.PI / 180)),
      6
    );
  });

  it("propagates range and gap errors from the formula", () => {
    expect(() => ehrk.SUN!.formula({ jd: 2461406.5 + 1 })).toThrow(RangeError);
    expect(() => ehrk.MOON!.formula({ jd: 2457300 })).toThrowError(/gap/i);
  });

  it("matches the direct sunRow lookup for every published column", () => {
    const jd = FIRST_JD + 0.5;
    const out = sunOut(jd);
    const direct = sunRow(jd);
    expect(out.coordinates[0]!.longitude).toBe(direct.lonDeg);
    expect(out.coordinates[0]!.latitude).toBe(direct.latDeg);
    expect(out.coordinates[1]!.longitude).toBe(direct.raDeg);
    expect(out.coordinates[1]!.latitude).toBe(direct.decDeg);
    expect(out.r).toBe(direct.distanceAu);
  });

  it("exposes the ephemeris equation of time in seconds", () => {
    const [jd] = sun[1000]!;
    expect(ehrk.eot!(jd)).toBe(sun[1000]![8]!);
    expect(ehrk.eot!(2460904.7083333335)).toBe(-246);
  });
});

function refSeries(): EhrkSeries {
  const sunRows = [
    [100, 0, 0, 0, 0, 1, 0, 0, 0],
    [150, 0, 0, 0, 0, 1, 0, 0, 0],
    [200, 0, 0, 0, 0, 1, 0, 0, 0],
  ] as const;
  const moonRows = [
    [100, 0, 0, 0, 0, 3600, 0, 0, 0],
    [150, 0, 0, 0, 0, 3600, 0, 0, 0],
    [200, 0, 0, 0, 0, 3600, 0, 0, 0],
  ] as const;
  return {
    id: "refs",
    validity: { from: 100, to: 200 },
    sun: sunRows,
    moon: moonRows,
    sunCoordinates: {
      ecliptic: trueEclipticOfDate,
      equatorial: meanEquatorialOfDate,
    },
    moonCoordinates: {
      ecliptic: meanEclipticOfDate,
      equatorial: trueEquatorialOfDate,
    },
  };
}

describe("createSunFormula series references", () => {
  it("uses the reference declared by the selected series", () => {
    const formula = createSunFormula(createSeriesRouter([refSeries()]));
    const out = formula({ jd: 150 });
    expect(out.primary).toEqual({
      system: "ecliptic",
      reference: trueEclipticOfDate,
    });
    expect(out.coordinates[1]).toEqual({
      system: "equatorial",
      reference: meanEquatorialOfDate,
      longitude: 0,
      latitude: 0,
    });
  });
});
