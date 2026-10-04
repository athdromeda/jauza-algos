import { describe, expect, it } from "vitest";
import { Earth, HijriCalendar, Rukyat } from "@jauza/core";
import { conjunction } from "../../src/conjunction.js";
import { createHilal } from "../../src/hilal.js";
import { ehrk } from "../../src/index.js";
import { defaultRouter } from "../../src/series.js";

const RAMADAN_1446_JD = new HijriCalendar(1446, 9, 1).jd;

describe("ehrk through @jauza/core Rukyat", () => {
  it("flows through Rukyat for ijtimak Ramadan 1446 H at Cibeas and matches direct conjunction", () => {
    const observer = new Earth([-7, 4, 26], [106, 31, 52], 137);
    const res = new Rukyat(1446, 9).with(ehrk).at(observer).conjunction();
    const direct = conjunction(RAMADAN_1446_JD);

    expect(res.ut).toBeCloseTo(direct.ut, 8);
    expect(res.jde).toBeCloseTo(direct.jde, 8);
    expect(res.moonLon).toBeCloseTo(direct.moonLon, 8);
    expect(res.sunLon).toBeCloseTo(direct.sunLon, 8);
    expect(res.ut).toBeCloseTo(2460734.53167547, 8);
    expect(res.hilal).toBeDefined();
  });
});

describe("ehrk hilal parallax accounting", () => {
  it("applies parallax exactly once (topocentric geometric → upper-limb)", () => {
    const observer = new Earth([-7, 4, 26], [106, 31, 52], 137);
    const res = new Rukyat(1446, 9).with(ehrk).at(observer).conjunction();
    const hilal = res.hilal!;

    // The custom hilal consumes the tabulated parallax itself; it must not have
    // been pre-applied by core's now-topocentric Earth.alt. Re-derive the
    // upper-limb altitude from the reported parts: geocentric center, minus one
    // parallax, plus refraction and dip, plus one lunar semidiameter.
    const recomposed =
      hilal.moonAltGeometric!.decimal -
      hilal.moonAltParallax!.decimal +
      hilal.moonAltRefraction!.decimal +
      hilal.moonAltDip!.decimal +
      (hilal.moonAltUpper!.decimal - hilal.moonAlt!.decimal);
    expect(recomposed).toBeCloseTo(hilal.moonAltUpper!.decimal, 4);

    // And core's topocentric horizontal stays consistent: one parallax applied.
    const direct = createHilal(defaultRouter)({
      observer,
      sunAlgo: ehrk,
      moonAlgo: ehrk,
      conjunction: {
        jde: res.jde,
        ut: res.ut,
        moonLon: res.moonLon,
        sunLon: res.sunLon,
      },
    });
    expect(direct.moonAltUpper!.decimal).toBeCloseTo(
      hilal.moonAltUpper!.decimal,
      6
    );
  });
});

describe("ehrk through Rukyat.visibility", () => {
  it("evaluates best-time geometry and returns auditable scores", () => {
    const observer = new Earth([-7, 4, 26], [106, 31, 52], 137);
    const result = new Rukyat(1446, 9).with(ehrk).at(observer).visibility();

    expect(Number.isFinite(result.yallop.q)).toBe(true);
    expect(Number.isFinite(result.odeh.v)).toBe(true);
    expect(Number.isFinite(result.geometry.moon.distanceKm)).toBe(true);

    expect(result.geometry.time.jd).toBeCloseTo(
      result.sunset.jd + (4 / 9) * (result.moonset.jd - result.sunset.jd),
      10
    );
    expect(result.geometry.time.jd).toBeGreaterThan(result.sunset.jd);
    expect(result.geometry.time.jd).toBeLessThan(result.moonset.jd);
  });
});