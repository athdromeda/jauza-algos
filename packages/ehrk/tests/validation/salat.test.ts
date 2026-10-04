import { describe, expect, it } from "vitest";
import { Earth, Salat, Time } from "@jauza/core";
import { trueEquatorialOfDate } from "@jauza/core/position";
import { ehrk } from "../../src/index.js";
import { sunRow } from "../../src/ephemeris.js";
import {
  SALAT_CASES,
  type SalatCase,
  toHours,
} from "./fixtures/ehrk-calculations.js";

const OPTIONS = {
  timezone: 7,
  asrFactor: 1 as const,
  ishaAlt: -18,
  fajrAlt: -20,
  dhuhaAlt: 4.5,
  maghribAlt: -1,
  sunriseAlt: -1,
};

const TIMES = [
  "zuhur",
  "asar",
  "maghrib",
  "isha",
  "subuh",
  "imsak",
  "terbit",
  "dhuha",
] as const;

// Worst observed deviation is ~1.04 s (2021 edition), all others ≤ 0.4 s.
const TOLERANCE_SEC = 2.5;

function computeSalat(c: SalatCase) {
  const s = new Salat(new Time(c.year, c.month, c.day, 5), OPTIONS)
    .at(new Earth(c.observer.lat, c.observer.lng, c.observer.h))
    .with(ehrk);
  return {
    zuhur: s.dhuhr(),
    asar: s.asr(),
    maghrib: s.maghrib(),
    isha: s.isha(),
    subuh: s.fajr(),
    // 2014 edition: imsak at h = -22°; later editions: 10 min before subuh.
    imsak: c.imsakAlt != null ? s.fajr(c.imsakAlt) : s.imsak(),
    terbit: s.sunrise(),
    // 2014 edition: h dhuha = 3°30'; later editions: 4°30'.
    dhuha: s.dhuha(c.dhuhaAlt ?? 4.5),
  };
}

describe("validation: shalat Real times against ehrk-calculations.md", () => {
  it.each(SALAT_CASES.map((c) => [c.label, c] as const))(
    "%s",
    (_label, c) => {
      const got = computeSalat(c);
      for (const t of TIMES) {
        const diffSec = (got[t] - toHours(c.expected[t])) * 3600;
        expect(
          Math.abs(diffSec),
          `${t}: got ${got[t].toFixed(5)}h, md ${toHours(c.expected[t]).toFixed(5)}h (${diffSec.toFixed(2)}s)`,
        ).toBeLessThan(TOLERANCE_SEC);
      }
    },
  );

  it("uses EHRK's tabulated solar declination without re-deriving it", () => {
    const c = SALAT_CASES.find((item) => item.year === 2025)!;
    const salat = new Salat(new Time(c.year, c.month, c.day, 5), OPTIONS)
      .at(new Earth(c.observer.lat, c.observer.lng, c.observer.h))
      .with(ehrk);
    const row = sunRow(new Time(c.year, c.month, c.day, 5).jd);

    expect(salat.sunPosition!.dec.decimal).toBeCloseTo(row.decDeg, 10);
    expect(
      salat.sunPosition!.explainCoordinates("equatorial", trueEquatorialOfDate)
        .steps,
    ).toEqual([
      expect.objectContaining({ metadata: { source: "native-table" } }),
    ]);
  });
});