import { describe, expect, it } from "vitest";
import { Earth, HijriCalendar, Rukyat } from "@jauza/core";
import { conjunction } from "../../src/conjunction.js";
import { ehrk } from "../../src/index.js";

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