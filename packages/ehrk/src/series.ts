import {
  meanEclipticOfDate,
  trueEclipticOfDate,
  trueEquatorialOfDate,
  type Reference,
} from "@jauza/core/position";
import { moon, sun, type MoonRow, type SunRow } from "./data.js";

export type EhrkSeriesCoordinates = {
  readonly ecliptic: Reference;
  readonly equatorial: Reference;
};

export type EhrkSeries = {
  readonly id: string;
  readonly validity: {
    readonly from: number;
    readonly to: number;
    readonly toInclusive?: boolean;
  };
  readonly sun: readonly SunRow[];
  readonly moon: readonly MoonRow[];
  readonly sunCoordinates: EhrkSeriesCoordinates;
  readonly moonCoordinates: EhrkSeriesCoordinates;
};

export const SERIES_2026_FROM = 2461041.5;

const sun2026Index = sun.findIndex(([jd]) => jd === SERIES_2026_FROM);
const moon2026Index = moon.findIndex(([jd]) => jd === SERIES_2026_FROM);

if (sun2026Index < 2 || moon2026Index < 2) {
  throw new Error(`EHRK: missing rows before the 2026 boundary ${SERIES_2026_FROM}`);
}

export const historicalSeries: EhrkSeries = {
  id: "ehrk-2014-2025",
  validity: {
    from: sun[0]![0],
    to: SERIES_2026_FROM,
    toInclusive: false,
  },
  sun: sun.slice(0, sun2026Index),
  moon: moon.slice(0, moon2026Index),
  sunCoordinates: {
    ecliptic: meanEclipticOfDate,
    equatorial: trueEquatorialOfDate,
  },
  moonCoordinates: {
    ecliptic: trueEclipticOfDate,
    equatorial: trueEquatorialOfDate,
  },
};

export const series2026: EhrkSeries = {
  id: "ehrk-2026",
  validity: {
    from: SERIES_2026_FROM,
    to: sun[sun.length - 1]![0],
  },
  sun: sun.slice(sun2026Index),
  moon: moon.slice(moon2026Index),
  sunCoordinates: {
    ecliptic: trueEclipticOfDate,
    equatorial: trueEquatorialOfDate,
  },
  moonCoordinates: {
    ecliptic: trueEclipticOfDate,
    equatorial: trueEquatorialOfDate,
  },
};

export function assertNonOverlapping(series: readonly EhrkSeries[]): void {
  const sorted = [...series].sort((a, b) => a.validity.from - b.validity.from);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const overlaps =
      cur.validity.from < prev.validity.to ||
      (cur.validity.from === prev.validity.to &&
        prev.validity.toInclusive !== false);
    if (overlaps) {
      throw new Error(
        `EHRK series overlap: ${prev.id} ends ${prev.validity.to}, ${cur.id} starts ${cur.validity.from}`
      );
    }
  }
}

export type SeriesRouter = {
  readonly series: readonly EhrkSeries[];
  seriesFor(jd: number): EhrkSeries;
};

export function createSeriesRouter(
  series: readonly EhrkSeries[]
): SeriesRouter {
  assertNonOverlapping(series);
  const ranges = series
    .map((s) => `${s.id} [${s.validity.from}, ${s.validity.to}]`)
    .join("; ");
  return {
    series,
    seriesFor(jd: number): EhrkSeries {
      for (const s of series) {
        const beforeEnd =
          s.validity.toInclusive === false
            ? jd < s.validity.to
            : jd <= s.validity.to;
        if (jd >= s.validity.from && beforeEnd) return s;
      }
      throw new RangeError(
        `EHRK: jd ${jd} is outside every supported series (${ranges})`
      );
    },
  };
}

export const SERIES: readonly EhrkSeries[] = [historicalSeries, series2026];
export const defaultRouter = createSeriesRouter(SERIES);
