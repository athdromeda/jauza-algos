import { describe, it, expect } from "vitest";
import { CDN_BASE, LEAP_SECONDS_KERNEL, EPHEMERIS_MAP } from "../../src/kernels.js";

describe("kernel registry", () => {
  it("uses the release CDN as the base", () => {
    expect(CDN_BASE).toBe("https://cdn-jauza.nqth.my.id/");
  });

  it("loads the leap-seconds kernel first", () => {
    expect(LEAP_SECONDS_KERNEL).toBe("naif0012.tls");
  });

  it("registers the supported CDN ephemeris series", () => {
    expect(EPHEMERIS_MAP).toEqual({
      "de421-slim": "de421-slim.bsp",
      "de430-slim": "de430-slim.bsp",
      "de435-slim": "de435-slim.bsp",
      "de440-slim": "de440-slim.bsp",
      "de440s-slim": "de440s-slim.bsp",
      "de442-slim": "de442-slim.bsp",
    });
  });
});
