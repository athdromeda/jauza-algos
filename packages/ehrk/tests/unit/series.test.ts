import { describe, expect, it } from "vitest";
import {
  meanEclipticOfDate,
  trueEclipticOfDate,
} from "@jauza/core/position";
import { moon, sun } from "../../src/data.js";
import {
  assertNonOverlapping,
  createSeriesRouter,
  defaultRouter,
  historicalSeries,
  type EhrkSeries,
} from "../../src/series.js";

const FIRST_JD = 2456658.5;
const LAST_JD = 2461406.5;
const SERIES_2026_FROM = 2461041.5;

function syntheticSeries(id: string, from: number, to: number): EhrkSeries {
  const sunRows = [
    [from, 0, 0, 0, 0, 1, 0, 0, 0],
    [to, 1, 0, 0, 0, 1, 0, 0, 0],
  ] as const;
  const moonRows = [
    [from, 0, 0, 0, 0, 3600, 0, 0, 0],
    [to, 1, 0, 0, 0, 3600, 0, 0, 0],
  ] as const;
  return {
    id,
    validity: { from, to },
    sun: sunRows,
    moon: moonRows,
    sunCoordinates: { ecliptic: trueEclipticOfDate, equatorial: trueEclipticOfDate },
    moonCoordinates: { ecliptic: trueEclipticOfDate, equatorial: trueEclipticOfDate },
  };
}

describe("ehrk series router", () => {
  it("routes 2026 to a separate true-ecliptic solar series", () => {
    const series2026 = defaultRouter.series[1]!;

    expect(defaultRouter.series).toHaveLength(2);
    expect(historicalSeries.validity).toEqual({
      from: FIRST_JD,
      to: SERIES_2026_FROM,
      toInclusive: false,
    });
    expect(historicalSeries.sunCoordinates.ecliptic).toEqual(
      meanEclipticOfDate,
    );
    expect(series2026.id).toBe("ehrk-2026");
    expect(series2026.validity).toEqual({
      from: SERIES_2026_FROM,
      to: LAST_JD,
    });
    expect(series2026.sunCoordinates.ecliptic).toEqual(trueEclipticOfDate);
  });

  it("switches series exactly at the 2026 boundary", () => {
    expect(defaultRouter.seriesFor(FIRST_JD)).toBe(historicalSeries);
    expect(defaultRouter.seriesFor(SERIES_2026_FROM - 1 / 86400)).toBe(
      historicalSeries,
    );
    expect(defaultRouter.seriesFor(SERIES_2026_FROM)).toBe(
      defaultRouter.series[1],
    );
    expect(defaultRouter.seriesFor(LAST_JD)).toBe(defaultRouter.series[1]);
  });

  it("throws a RangeError for a jd outside every series", () => {
    expect(() => defaultRouter.seriesFor(FIRST_JD - 1)).toThrow(RangeError);
    expect(() => defaultRouter.seriesFor(LAST_JD + 1)).toThrow(RangeError);
  });

  it("routes disjoint series to their own ranges", () => {
    const a = syntheticSeries("a", 100, 200);
    const b = syntheticSeries("b", 200.5, 300);
    const router = createSeriesRouter([a, b]);
    expect(router.seriesFor(150)).toBe(a);
    expect(router.seriesFor(200.5)).toBe(b);
    expect(() => router.seriesFor(200.25)).toThrow(RangeError);
  });

  it("rejects overlapping series", () => {
    const a = syntheticSeries("a", 100, 200);
    const b = syntheticSeries("b", 150, 300);
    expect(() => assertNonOverlapping([a, b])).toThrowError(/overlap/i);
    expect(() => createSeriesRouter([a, b])).toThrowError(/overlap/i);
  });

  it("accepts adjacent non-overlapping series", () => {
    const a = syntheticSeries("a", 100, 200);
    const b = syntheticSeries("b", 201, 300);
    expect(() => assertNonOverlapping([a, b])).not.toThrow();
  });
});
