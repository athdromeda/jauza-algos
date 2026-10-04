import { Time } from "@jauza/core";
import type { AlgoConfig, ConjunctionResult } from "@jauza/core";
import { ephemerisFor } from "./ephemeris.js";
import { defaultRouter, type EhrkSeries, type SeriesRouter } from "./series.js";

const HOUR_DAYS = 1 / 24;
const DAY_SECONDS = 86400;

export function getDeltaTEspenak(year: number): number {
  const t = year - 2015;
  return 67.62 + 0.3645 * t + 0.0039755 * t * t;
}

function assertWindowInSeries(
  series: EhrkSeries,
  windowStart: number,
  windowEnd: number
): void {
  if (windowStart < series.validity.from || windowEnd > series.validity.to) {
    throw new RangeError(
      `EHRK conjunction: FIB window ${windowStart}–${windowEnd} is not fully inside series ${series.id} [${series.validity.from}, ${series.validity.to}]`
    );
  }
}

export function createConjunction(router: SeriesRouter) {
  return function conjunction(
    anchorJd: number,
    _options?: {
      sunAlgo?: AlgoConfig;
      moonAlgo?: AlgoConfig;
      [key: string]: unknown;
    }
  ): ConjunctionResult {
    const series = router.seriesFor(anchorJd);
    const eph = ephemerisFor(series);
    const targetStart = Math.floor(anchorJd) - 0.5;
    const windowStart = targetStart - 1;
    const windowEnd = targetStart + 1;
    assertWindowInSeries(series, windowStart, windowEnd);

    let minJd = NaN;
    let minFib = Infinity;
    for (const row of series.moon) {
      if (row[0] < windowStart) continue;
      if (row[0] >= windowEnd) break;
      if (row[8] < minFib) {
        minFib = row[8];
        minJd = row[0];
      }
    }
    if (!Number.isFinite(minJd)) {
      throw new Error(
        `EHRK conjunction: no moon rows in the FIB window ${windowStart}–${windowEnd} for series ${series.id}`
      );
    }

    const elm0 = eph.sunRow(minJd).lonDeg;
    const elm1 = eph.sunRow(minJd + HOUR_DAYS).lonDeg;
    const alb0 = eph.moonRow(minJd).lonDeg;
    const alb1 = eph.moonRow(minJd + HOUR_DAYS).lonDeg;

    const b1 = elm1 - elm0;
    const b2 = alb1 - alb0;
    const mb = elm0 - alb0;
    const sb = b2 - b1;

    if (!Number.isFinite(sb) || sb === 0) {
      throw new Error(
        `EHRK conjunction: degenerate hourly longitude rate (SB=${sb}); cannot interpolate`
      );
    }

    const jde = minJd + (mb / sb) * HOUR_DAYS;
    const ut = jde - getDeltaTEspenak(new Time(jde).year) / DAY_SECONDS;

    return {
      jde,
      ut,
      moonLon: eph.moonRow(jde).lonDeg,
      sunLon: eph.sunRow(jde).lonDeg,
    };
  };
}

export const conjunction = createConjunction(defaultRouter);
