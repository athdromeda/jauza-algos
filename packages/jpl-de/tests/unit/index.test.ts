import { describe, it, expect } from "vitest";
import { equatorialJ2000 } from "@jauza/core/position";
import { jplDe } from "../../src/index.js";

describe("jplDe sync contract", () => {
  it("throws synchronously for an unknown ephemeris", () => {
    expect(() => jplDe.load("de421")).toThrow(
      /Unknown JPL DE ephemeris "de421"/,
    );
  });

  it("throws if ready is accessed before any load", () => {
    expect(() => jplDe.ready).toThrow(/load\(name\) must be called/);
  });

  it("load() returns a J2000-equatorial adapter shape without observing", () => {
    const cfg = jplDe.load("de440-slim");
    expect(cfg.name).toBe("JplDe");
    expect(cfg.bodies).toEqual(["MOON", "SUN"]);
    expect(cfg.metadata.validity?.note).toMatch(
      /does not account for leap seconds after 2016-12-31/,
    );

    for (const body of ["MOON", "SUN"] as const) {
      const config = cfg[body]!;
      expect(config.outputType).toBe("EQUATORIAL");
      expect(config.origin).toBe("earth");
      if (config.outputType === "MULTI_SPHERICAL") {
        throw new Error("expected a legacy equatorial body config");
      }
      expect(config.system).toBe("equatorial");
      expect(config.reference).toEqual(equatorialJ2000);
      expect(typeof config.formula).toBe("function");
    }
  });
});
