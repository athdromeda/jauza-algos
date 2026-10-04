import { describe, expect, it } from "vitest";
import { Earth, Salat, Time } from "@jauza/core";
import { ehrk } from "../../src/index.js";

const hms = (h: number, m: number, s: number) => h + m / 60 + s / 3600;

describe("Salat end-to-end against salat-example.md", () => {
  const observer = new Earth(-6.166667, 106.816667, 0);
  const salat = new Salat(new Time(2025, 8, 17, 5), {
    timezone: 7,
    asrFactor: 1,
    ishaAlt: -18,
    fajrAlt: -20,
    dhuhaAlt: 4.5,
    maghribAlt: -1,
    sunriseAlt: -1,
  })
    .at(observer)
    .with(ehrk);

  it("reads the ephemeris equation of time, e = -00:04:06", () => {
    expect(salat.eot()).toBeCloseTo(hms(0, -4, -6) * 60, 6);
  });

  it("reads the ephemeris sun declination, delta = 13°20'06\"", () => {
    expect(salat.sunPosition!.dec.decimal).toBeCloseTo(hms(13, 20, 6), 2);
  });

  it("Istiwa / Zuhur = 11:56:50 WIB (LMT - KWD)", () => {
    expect(salat.istiwa()).toBeCloseTo(hms(11, 56, 50), 4);
    expect(salat.dhuhr()).toBeCloseTo(hms(11, 56, 50), 4);
  });

  it("Ashar = 15:17:45.84 WIB", () => {
    expect(salat.asr()).toBeCloseTo(hms(15, 17, 45.84), 4);
  });

  it("Maghrib = 17:55:05.90 WIB", () => {
    expect(salat.maghrib()).toBeCloseTo(hms(17, 55, 5.9), 4);
  });

  it("Isya = 19:05:10.79 WIB", () => {
    expect(salat.isha()).toBeCloseTo(hms(19, 5, 10.79), 4);
  });

  it("Subuh = 04:40:15.60 WIB", () => {
    expect(salat.fajr()).toBeCloseTo(hms(4, 40, 15.6), 4);
  });

  it("Imsak = 10 minutes before Subuh = 04:30:15.60 WIB", () => {
    expect(salat.imsak()).toBeCloseTo(hms(4, 30, 15.6), 4);
  });

  it("Terbit = 05:58:34.10 WIB", () => {
    expect(salat.sunrise()).toBeCloseTo(hms(5, 58, 34.1), 4);
  });

  it("Duha = 06:21:20.21 WIB", () => {
    expect(salat.dhuha()).toBeCloseTo(hms(6, 21, 20.21), 4);
  });
});
