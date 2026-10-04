import { describe, expect, it } from "vitest";
import { moon, sun } from "../../src/data.js";

const FIRST_JD = 2456658.5;
const LAST_JD = 2461406.5;

describe("ehrk data", () => {
  it("ships 96410 sun and moon rows over the documented range", () => {
    expect(sun).toHaveLength(96410);
    expect(moon).toHaveLength(96410);
    expect(sun[0]![0]).toBe(FIRST_JD);
    expect(sun[sun.length - 1]![0]).toBe(LAST_JD);
    expect(moon[0]![0]).toBe(FIRST_JD);
    expect(moon[moon.length - 1]![0]).toBe(LAST_JD);
  });

  it("has exactly the one remaining data gap (2015–2017)", () => {
    const gaps = (rows: readonly (readonly number[])[]) => {
      const out: number[][] = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i]![0]! - rows[i - 1]![0]! > 0.5) {
          out.push([rows[i - 1]![0]!, rows[i]![0]!]);
        }
      }
      return out;
    };
    expect(gaps(sun)).toEqual([[2457023.5, 2457754.5]]);
    expect(gaps(moon)).toEqual([[2457023.5, 2457754.5]]);
  });
});