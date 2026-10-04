import { describe, expect, it } from "vitest";
import { Rukyat } from "@jauza/core";
import { ehrk } from "../../src/index.js";
import { CONJUNCTION_CASES } from "./fixtures/ehrk-calculations.js";

// Seconds of day (UT), 00:00–24:00.
const secsOfDay = (jd: number) => ((jd + 0.5) % 1) * 86400;

// Worst observed deviation is 2.79 s (Syawal 1435, where the book's printed
// hourly longitudes are rounded to arcsec); all other cases < 0.01 s.
const JDE_TOLERANCE_SEC = 4;
const UT_TOLERANCE_SEC = 0.5;

describe("validation: ijtima (conjunction) against ehrk-calculations.md", () => {
  it.each(CONJUNCTION_CASES.map((c) => [c.label, c] as const))(
    "%s",
    (_label, c) => {
      const res = new Rukyat(c.hijri[0], c.hijri[1]).with(ehrk).conjunction();
      const gotJde = secsOfDay(res.jde);
      expect(
        Math.abs(gotJde - c.jdeSecOfDay),
        `jde ${gotJde.toFixed(2)}s vs md ${c.jdeSecOfDay}s`,
      ).toBeLessThan(JDE_TOLERANCE_SEC);

      if (c.utSecOfDay != null) {
        const gotUt = secsOfDay(res.ut);
        expect(
          Math.abs(gotUt - c.utSecOfDay),
          `ut ${gotUt.toFixed(2)}s vs md ${c.utSecOfDay}s`,
        ).toBeLessThan(UT_TOLERANCE_SEC);
      }
    },
  );
});