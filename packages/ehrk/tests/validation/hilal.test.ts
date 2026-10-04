import { describe, expect, it } from "vitest";
import { Earth, Rukyat } from "@jauza/core";
import { ehrk } from "../../src/index.js";
import {
  HILAL_CASES,
  azimuthDeg,
  toHours,
  type HilalCase,
} from "./fixtures/ehrk-calculations.js";

// --- tolerances (measured library-vs-md deviation across all 13 cases) ---
// The ehrk package now ships a book-exact `hilal` implementation (ghurub
// spherical formula, mar'i moon altitude with parallax + refraction table + dip,
// SBS-based lag/moonset, FIB illumination), so most fields match to <1s / <0.02°.
// Remaining documented offsets:
//  - elongation ≤2022: the md's "Jarak Busur" is the *topocentric* arc, while
//    ehrk reports the geocentric one (item 4 deferred) → wide tolerance.
//  - Ramadan 1443 H moon altitude: the book's result table (2°22′54.65″)
//    disagrees with its own step 27 (2°22′24.52″); ehrk matches step 27.
//  - Ramadan 1439 H moon azimuth: the book's printed value is internally
//    inconsistent (its step 35 vs the result table); ehrk follows the steps.
//  - Zulhijjah 1435 H lag/moonset: the 2014 edition used the pre-2025 SBS
//    branch rule for SBSH ≥ 90°, differing from conjunction-example.md.
//  - Age (2023): the book used the Morrison & Stephenson (1982) parabola
//    (~132 s) for 2021–2023, not Espenak & Meeus (~70 s) which ehrk uses, so
//    age is off by ~1 min there (see anomalies.md §4).
const SUNSET_TOL_H = 0.0005; // max <0.5 s (book spherical ghurub vs ehrk)
const SUN_AZ_TOL_DEG = 0.05; // max ~0.0°
const MOON_ALT_TOL_DEG = 0.05; // max ~0.02° (limb-aware; book alt anomalies excluded)
const MOON_AZ_TOL_DEG = 0.6; // max ~0.44° (1439 book anomaly)
const MOON_POS_TOL_DEG = 0.5; // max ~0.44° (1439 book anomaly)
const LAG_TOL_H = 0.02; // max ~1 min (1435 Zulhijjah SBS branch anomaly)
const MOONSET_TOL_H = 0.02; // max ~59 s (1435 Zulhijjah SBS branch anomaly)
const MOONSET_AZ_TOL_DEG = 0.05; // max ~0.03°
const ILLUMINATION_TOL_PCT = 0.02; // max ~0.009%
const AGE_TOL_H = 0.05; // max ~1.3 min (1444 ΔT book anomaly)

const secsOfDay = (jd: number) => ((jd + 0.5) % 1) * 86400;
const wibHours = (jd: number) => ((secsOfDay(jd) + 7 * 3600) % 86400) / 3600;

function computeHilal(c: HilalCase) {
  const res = new Rukyat(c.hijri[0], c.hijri[1])
    .with(ehrk)
    .at(new Earth(c.observer.lat, c.observer.lng, c.observer.h))
    .conjunction();
  return res.hilal!;
}

// Canonical worked example from conjunction-example.md (Ramadan 1446 H, Cibeas),
// used for the public Rukyat surface (visibility, format) beyond the hilal table.
const CANONICAL = HILAL_CASES.find((c) => c.hijri[0] === 1446)!;
function canonicalRukyat() {
  const r = new Rukyat(CANONICAL.hijri[0], CANONICAL.hijri[1])
    .with(ehrk)
    .at(new Earth(CANONICAL.observer.lat, CANONICAL.observer.lng, CANONICAL.observer.h));
  r.conjunction();
  return r;
}

describe("validation: hilal against ehrk-calculations.md", () => {
  it.each(HILAL_CASES.map((c) => [c.label, c] as const))(
    "%s",
    (_label, c) => {
      const h = computeHilal(c);
      const md = c.md;

      // Sunset time (WIB).
      expect(
        Math.abs(wibHours(h.sunset.jd) - toHours(md.sunset)),
        `sunset ${wibHours(h.sunset.jd).toFixed(5)}h vs md ${toHours(md.sunset).toFixed(5)}h`,
      ).toBeLessThan(SUNSET_TOL_H);

      // Sun / moon / moonset azimuth (absolute degrees).
      expect(Math.abs(h.sunAzimuth.decimal - azimuthDeg(md.sunAzimuth))).toBeLessThan(
        SUN_AZ_TOL_DEG,
      );
      expect(Math.abs(h.moonAzimuth.decimal - azimuthDeg(md.moonAzimuth))).toBeLessThan(
        MOON_AZ_TOL_DEG,
      );
      expect(
        Math.abs(h.moonsetAzimuth.decimal - azimuthDeg(md.moonsetAzimuth)),
      ).toBeLessThan(MOONSET_AZ_TOL_DEG);

      // Moon altitude: mar'i, per the limb convention each edition prints
      // (≤2018, 2022, 2025 & 2026 print the upper limb; 2019–2021, 2023 & 2024
      // the center).
      const limb = c.md.moonAltLimb;
      const moonAlt = limb === "upper" ? h.moonAltUpper!.decimal : h.moonAlt.decimal;
      expect(Math.abs(moonAlt - md.moonAlt)).toBeLessThan(
        md.moonAltTolDeg ?? MOON_ALT_TOL_DEG,
      );

      // Relative moon position: magnitude + which side of the sun.
      expect(Math.abs(h.moonPosition.decimal - Math.abs(md.moonPosition))).toBeLessThan(
        MOON_POS_TOL_DEG,
      );
      expect(Math.sign(h.moonAzimuth.decimal - h.sunAzimuth.decimal)).toBe(
        Math.sign(md.moonPosition),
      );

      // Crescent condition = the crescent's tilt, which leans AWAY from the sun:
// moon south of the sun ("Posisi Hilal" negative) → "Tilted North". This is
// the convention the md prints for 2014–2020; the 2025 edition's step-40 rule
// prints the opposite wording (see anomalies.md §5).
      expect(h.crescentCondition).toBe(
        md.moonPosition < 0 ? "Tilted North" : "Tilted South",
      );

      // Geocentric elongation: the 2023+ editions report it directly and match
      // within ~0.15°. The 2014–2022 "Jarak Busur" is the topocentric arc (item 4
      // deferred), so it keeps a wide documented tolerance.
      const elongationTol = md.sunAzimuth.northOfWest ? 1.5 : 0.3;
      expect(Math.abs(h.elongation.decimal - md.elongation)).toBeLessThan(
        elongationTol,
      );

      // Lag (book's SBS-based "Lama Hilal") and moonset.
      expect(Math.abs(h.lag.decimal - toHours(md.lag))).toBeLessThan(LAG_TOL_H);
      expect(
        Math.abs(wibHours(h.moonset.jd) - toHours(md.moonset)),
        `moonset ${wibHours(h.moonset.jd).toFixed(5)}h vs md ${toHours(md.moonset).toFixed(5)}h`,
      ).toBeLessThan(MOONSET_TOL_H);

      // Age (only where the edition lists it).
      if (md.age != null) {
        expect(Math.abs(h.age.decimal - toHours(md.age))).toBeLessThan(AGE_TOL_H);
      }

      // Illumination: FIB from the ehrk ephemeris at sunset, matching the md's
      // "Iluminasi Bulan" convention directly.
      expect(
        Math.abs(h.illumination - md.illumination),
        `illum ${h.illumination.toFixed(3)}% vs md ${md.illumination}%`,
      ).toBeLessThan(ILLUMINATION_TOL_PCT);
    },
  );

  it("visibility: the Ramadan 1446 Cibeas crescent is below every criterion", () => {
    expect(canonicalRukyat().visibility()).toEqual({
      odeh: false,
      newMabims: false,
      yallop: false,
      danjon: false,
      diyanet: false,
    });
  });

  it("format() renders the key hilal values", () => {
    const text = canonicalRukyat().format();
    expect(text).toContain("Sunset");
    // Ramadan 1446 H: the moon is north of the sun → the crescent tilts south.
    expect(text).toContain("Tilted South");
    expect(text).toContain("Moon Age");
  });
});