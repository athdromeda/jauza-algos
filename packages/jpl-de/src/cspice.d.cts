import type { CspiceModule } from "./types.js";

declare function createCSPICE(): Promise<CspiceModule>;
export = createCSPICE;