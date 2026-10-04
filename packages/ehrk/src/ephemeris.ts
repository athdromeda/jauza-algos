import { defaultRouter, type EhrkSeries } from "./series.js";

export const ARCSEC_PER_DEG = 3600;
export const R_EARTH_KM = 6378.137;

const FULL_CIRCLE_ARCSEC = 360 * ARCSEC_PER_DEG;
const HALF_CIRCLE_ARCSEC = 180 * ARCSEC_PER_DEG;
const GAP_THRESHOLD_DAYS = 0.5;

type Row = readonly number[];
type Gaps = readonly (readonly [afterJd: number, beforeJd: number])[];

export type SunSample = {
  lonDeg: number;
  latDeg: number;
  raDeg: number;
  decDeg: number;
  distanceAu: number;
  sdDeg: number;
  epsilonDeg: number;
  eotSec: number;
};

export type MoonSample = {
  lonDeg: number;
  latDeg: number;
  raDeg: number;
  decDeg: number;
  distanceKm: number;
  parallaxDeg: number;
  sdDeg: number;
  fib: number;
};

export type EhrkEphemeris = {
  readonly series: EhrkSeries;
  sunRow(jd: number): SunSample;
  moonRow(jd: number): MoonSample;
};

function jdOf(row: Row): number {
  return row[0]!;
}

function findGaps(rows: readonly Row[]): Gaps {
  const gaps: [number, number][] = [];
  for (let i = 1; i < rows.length; i++) {
    if (jdOf(rows[i]!) - jdOf(rows[i - 1]!) > GAP_THRESHOLD_DAYS) {
      gaps.push([jdOf(rows[i - 1]!), jdOf(rows[i]!)]);
    }
  }
  return gaps;
}

function assertAvailable(
  jd: number,
  name: "sun" | "moon",
  gaps: Gaps,
  series: EhrkSeries,
): void {
  const { from, to, toInclusive } = series.validity;
  const afterEnd = toInclusive === false ? jd >= to : jd > to;
  if (jd < from || afterEnd) {
    throw new RangeError(
      `EHRK ${series.id} ${name}: jd ${jd} is outside the supported series range ${from}–${to}`,
    );
  }
  for (const [afterJd, beforeJd] of gaps) {
    if (jd > afterJd && jd < beforeJd) {
      throw new Error(
        `EHRK ${series.id} ${name}: jd ${jd} falls inside a data gap (${afterJd}–${beforeJd}) where the table has no rows`,
      );
    }
  }
}

function bracket(rows: readonly Row[], jd: number): [lo: number, hi: number] {
  let lo = 0;
  let hi = rows.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (jdOf(rows[mid]!) < jd) lo = mid + 1;
    else hi = mid;
  }
  return [lo - 1, lo];
}

function sample(
  rows: readonly Row[],
  jd: number,
  pick: (row: Row) => number,
): number {
  const [lo, hiIdx] = bracket(rows, jd);
  const hiRow = rows[hiIdx]!;
  if (jdOf(hiRow) === jd) return pick(hiRow);
  const loRow = rows[lo]!;
  const t = (jd - jdOf(loRow)) / (jdOf(hiRow) - jdOf(loRow));
  return pick(loRow) + t * (pick(hiRow) - pick(loRow));
}

function sampleAngle(
  rows: readonly Row[],
  jd: number,
  pick: (row: Row) => number,
): number {
  const [lo, hiIdx] = bracket(rows, jd);
  const hiRow = rows[hiIdx]!;
  if (jdOf(hiRow) === jd) return pick(hiRow);
  const loRow = rows[lo]!;
  let v0 = pick(loRow);
  let v1 = pick(hiRow);
  if (v1 - v0 > HALF_CIRCLE_ARCSEC) v1 -= FULL_CIRCLE_ARCSEC;
  else if (v1 - v0 < -HALF_CIRCLE_ARCSEC) v1 += FULL_CIRCLE_ARCSEC;
  const t = (jd - jdOf(loRow)) / (jdOf(hiRow) - jdOf(loRow));
  let out = v0 + t * (v1 - v0);
  out %= FULL_CIRCLE_ARCSEC;
  if (out < 0) out += FULL_CIRCLE_ARCSEC;
  return out;
}

function toDeg(arcsec: number): number {
  return arcsec / ARCSEC_PER_DEG;
}

export function createEphemeris(series: EhrkSeries): EhrkEphemeris {
  const sunRows = series.sun;
  const moonRows = series.moon;
  const sunGaps = findGaps(sunRows);
  const moonGaps = findGaps(moonRows);
  return {
    series,
    sunRow(jd: number): SunSample {
      assertAvailable(jd, "sun", sunGaps, series);
      return {
        lonDeg: toDeg(sampleAngle(sunRows, jd, (r) => r[1]!)),
        latDeg: toDeg(sample(sunRows, jd, (r) => r[2]!)),
        raDeg: toDeg(sampleAngle(sunRows, jd, (r) => r[3]!)),
        decDeg: toDeg(sample(sunRows, jd, (r) => r[4]!)),
        distanceAu: sample(sunRows, jd, (r) => r[5]!),
        sdDeg: toDeg(sample(sunRows, jd, (r) => r[6]!)),
        epsilonDeg: toDeg(sample(sunRows, jd, (r) => r[7]!)),
        eotSec: sample(sunRows, jd, (r) => r[8]!),
      };
    },
    moonRow(jd: number): MoonSample {
      assertAvailable(jd, "moon", moonGaps, series);
      const parallaxArcsec = sample(moonRows, jd, (r) => r[5]!);
      const parallaxRad = toDeg(parallaxArcsec) * (Math.PI / 180);
      return {
        lonDeg: toDeg(sampleAngle(moonRows, jd, (r) => r[1]!)),
        latDeg: toDeg(sample(moonRows, jd, (r) => r[2]!)),
        raDeg: toDeg(sampleAngle(moonRows, jd, (r) => r[3]!)),
        decDeg: toDeg(sample(moonRows, jd, (r) => r[4]!)),
        distanceKm: R_EARTH_KM / Math.sin(parallaxRad),
        parallaxDeg: toDeg(parallaxArcsec),
        sdDeg: toDeg(sample(moonRows, jd, (r) => r[6]!)),
        fib: sample(moonRows, jd, (r) => r[8]!),
      };
    },
  };
}

const ephemerisCache = new WeakMap<EhrkSeries, EhrkEphemeris>();

export function ephemerisFor(series: EhrkSeries): EhrkEphemeris {
  let eph = ephemerisCache.get(series);
  if (!eph) {
    eph = createEphemeris(series);
    ephemerisCache.set(series, eph);
  }
  return eph;
}

export function sunRow(jd: number): SunSample {
  return ephemerisFor(defaultRouter.seriesFor(jd)).sunRow(jd);
}

export function moonRow(jd: number): MoonSample {
  return ephemerisFor(defaultRouter.seriesFor(jd)).moonRow(jd);
}
