import { describe, expect, it } from "vitest";
import { HijriCalendar } from "@jauza/core";
import { conjunction, getDeltaTEspenak } from "../../src/conjunction.js";
import { moon } from "../../src/data.js";

const RAMADAN_1446_JD = new HijriCalendar(1446, 9, 1).jd;

describe("ehrk conjunction engine", () => {
  it("computes delta T via Espenak 2015–3000", () => {
    expect(getDeltaTEspenak(2025)).toBeCloseTo(71.66255, 10);
    // The 2021–2023 editions subtract ΔT ≈ 129.7–132.4 s while Espenak gives
    // ≈ 70 s; only 2025 matches, where the book's ΔT equals Espenak. That is
    // why validation asserts res.jde (raw interpolation moment) for all cases
    // but res.ut only for 2025.
    expect(getDeltaTEspenak(2021)).toBeCloseTo(69.95, 1);
    expect(getDeltaTEspenak(2023)).toBeCloseTo(70.79, 1);
  });

  it("finds the md's smallest FIB at 2025-02-28 01:00 UT", () => {
    const windowStart = Math.floor(RAMADAN_1446_JD) - 1.5;
    const windowEnd = Math.floor(RAMADAN_1446_JD) + 0.5;
    let minJd = NaN;
    let minFib = Infinity;
    for (const row of moon) {
      if (row[0]! < windowStart) continue;
      if (row[0]! >= windowEnd) break;
      if (row[8]! < minFib) {
        minFib = row[8]!;
        minJd = row[0]!;
      }
    }
    expect(minFib).toBe(0.0002);
    expect(minJd).toBeCloseTo(2460734.5416666665, 10);
  });

  it("throws a clear error when the window falls in a moon-table gap", () => {
    // Anchor 2457300 puts its 2-day FIB window inside the (2457023.5, 2457754.5)
    // 2015–2017 gap, the only remaining table gap.
    expect(() => conjunction(2457300)).toThrowError(/no moon rows/i);
  });

  it("throws a clear error when the anchor is outside the table range", () => {
    // Anchors outside every series now fail in the router with a RangeError.
    expect(() => conjunction(2456000)).toThrow(RangeError);
    expect(() => conjunction(3000000)).toThrow(RangeError);
  });
});