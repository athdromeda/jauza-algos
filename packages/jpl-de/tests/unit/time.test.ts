import { describe, it, expect } from "vitest";
import { jdToUtcString } from "../../src/time.js";

describe("jdToUtcString", () => {
  it("formats JD 2448908.5 as 1992-10-13 00:00:00.000", () => {
    expect(jdToUtcString(2448908.5)).toBe("1992-10-13 00:00:00.000");
  });

  it("formats JD 2440587.5 as the Unix epoch 1970-01-01 00:00:00.000", () => {
    expect(jdToUtcString(2440587.5)).toBe("1970-01-01 00:00:00.000");
  });

  it("formats a fractional day as the correct time of day", () => {
    expect(jdToUtcString(2440587.75)).toBe("1970-01-01 06:00:00.000");
  });

  it("formats an arbitrary fractional instant", () => {
    expect(jdToUtcString(2440587.2505833335)).toBe("1969-12-31 18:00:50.400");
  });
});