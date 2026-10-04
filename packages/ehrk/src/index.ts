import type {
  AlgorithmAdapter,
  EotFn,
  ExtendedAlgorithmMetadata,
  MultiCoordinateOutput,
} from "@jauza/core";
import { createConjunction } from "./conjunction.js";
import { createHilal } from "./hilal.js";
import { ephemerisFor } from "./ephemeris.js";
import { defaultRouter, type SeriesRouter } from "./series.js";

export function createSunFormula(router: SeriesRouter) {
  return function sunFormula({ jd }: { jd: number }): MultiCoordinateOutput {
    const series = router.seriesFor(jd);
    const row = ephemerisFor(series).sunRow(jd);
    return {
      r: row.distanceAu,
      primary: {
        system: "ecliptic",
        reference: series.sunCoordinates.ecliptic,
      },
      coordinates: [
        {
          system: "ecliptic",
          reference: series.sunCoordinates.ecliptic,
          longitude: row.lonDeg,
          latitude: row.latDeg,
        },
        {
          system: "equatorial",
          reference: series.sunCoordinates.equatorial,
          longitude: row.raDeg,
          latitude: row.decDeg,
        },
      ],
    };
  };
}

export function createMoonFormula(router: SeriesRouter) {
  return function moonFormula({ jd }: { jd: number }): MultiCoordinateOutput {
    const series = router.seriesFor(jd);
    const row = ephemerisFor(series).moonRow(jd);
    return {
      r: row.distanceKm,
      primary: {
        system: "ecliptic",
        reference: series.moonCoordinates.ecliptic,
      },
      coordinates: [
        {
          system: "ecliptic",
          reference: series.moonCoordinates.ecliptic,
          longitude: row.lonDeg,
          latitude: row.latDeg,
        },
        {
          system: "equatorial",
          reference: series.moonCoordinates.equatorial,
          longitude: row.raDeg,
          latitude: row.decDeg,
        },
      ],
    };
  };
}

export function createEot(router: SeriesRouter): EotFn {
  return (jd: number) => ephemerisFor(router.seriesFor(jd)).sunRow(jd).eotSec;
}

const from = Math.min(...defaultRouter.series.map((s) => s.validity.from));
const to = Math.max(...defaultRouter.series.map((s) => s.validity.to));

const metadata: ExtendedAlgorithmMetadata = {
  timeScale: "UTC",
  epoch: "mean-of-date",
  validity: {
    from,
    to,
    note: "hourly tables with data gaps; out-of-range and gap jd throw",
  },
  corrections: [],
};

export const ehrk: AlgorithmAdapter<MultiCoordinateOutput> = {
  name: "EHRK",
  metadata,
  conjunction: createConjunction(defaultRouter),
  hilal: createHilal(defaultRouter),
  eot: createEot(defaultRouter),
  bodies: ["SUN", "MOON"],
  SUN: {
    outputType: "MULTI_SPHERICAL",
    origin: "earth",
    formula: createSunFormula(defaultRouter),
    distanceUnit: "au",
  },
  MOON: {
    outputType: "MULTI_SPHERICAL",
    origin: "earth",
    formula: createMoonFormula(defaultRouter),
    distanceUnit: "km",
  },
};
