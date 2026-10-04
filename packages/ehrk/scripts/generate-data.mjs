import { readFileSync, writeFileSync } from "node:fs";

const load = (file) =>
  JSON.parse(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"));

const sun = load("sun.json");
const moon = load("moon.json");

const sunBlock = `export type SunRow = readonly [
  jd: number,
  eclipticLongitude: number,
  eclipticLatitude: number,
  rightAscension: number,
  declination: number,
  distanceAu: number,
  semiDiameter: number,
  obliquity: number,
  equationOfTime: number,
];

export const sun: readonly SunRow[] = ${JSON.stringify(sun)};
`;

const moonBlock = `export type MoonRow = readonly [
  jd: number,
  apparentLongitude: number,
  apparentLatitude: number,
  rightAscension: number,
  declination: number,
  horizontalParallax: number,
  semiDiameter: number,
  angleBrightLimb: number,
  fractionIllumination: number,
];

export const moon: readonly MoonRow[] = ${JSON.stringify(moon)};
`;

writeFileSync(
  new URL("../src/data.ts", import.meta.url),
  `${sunBlock}\n${moonBlock}`,
);
console.log(
  `wrote src/data.ts (${sun.length} sun rows, ${moon.length} moon rows)`,
);