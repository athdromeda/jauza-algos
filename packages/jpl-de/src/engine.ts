import createCSPICE from "./cspice.cjs";
import { CDN_BASE, LEAP_SECONDS_KERNEL, EPHEMERIS_MAP } from "./kernels.js";
import { jdToUtcString } from "./time.js";
import type { BodyPosition, CspiceModule } from "./types.js";

export class CspiceNotReadyError extends Error {
  constructor() {
    super("await jplDe.ready before observing");
    this.name = "CspiceNotReadyError";
  }
}

const writeCString = (mod: CspiceModule, str: string): number => {
  const ptr = mod._malloc(str.length + 1);
  mod.stringToUTF8(str, ptr, str.length + 1);
  return ptr;
};

export class CspiceEngine {
  #mod: CspiceModule | null = null;
  #ready: Promise<void> | null = null;
  #startedName: string | null = null;
  #loaded = new Set<string>();

  get ready(): Promise<void> | null {
    return this.#ready;
  }

  isReady(): boolean {
    return this.#mod !== null;
  }

  start(name: string): Promise<void> {
    if (this.#ready) {
      if (this.#startedName !== name) {
        throw new Error(
          `CSPICE is already initialized with "${this.#startedName}"; cannot start "${name}" in the same engine`,
        );
      }
      return this.#ready;
    }
    this.#startedName = name;
    this.#ready = this.#init(name);
    return this.#ready;
  }

  async #init(name: string): Promise<void> {
    const mod = await createCSPICE();
    this.#mod = mod;

    const bsp = EPHEMERIS_MAP[name];
    if (!bsp) {
      throw new Error(`Unknown JPL DE ephemeris "${name}"`);
    }
    const kernels = [LEAP_SECONDS_KERNEL, bsp];
    for (const filename of kernels) {
      if (this.#loaded.has(filename)) continue;
      await this.#loadKernel(mod, filename);
      this.#loaded.add(filename);
    }
  }

  async #loadKernel(mod: CspiceModule, filename: string): Promise<void> {
    const res = await fetch(`${CDN_BASE}${filename}`);
    if (!res.ok) {
      throw new Error(`Kernel fetch failed for "${filename}" (HTTP ${res.status})`);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    mod.FS.writeFile(filename, bytes);

    const pathPtr = writeCString(mod, filename);
    try {
      mod._furnsh_c(pathPtr);
    } finally {
      mod._free(pathPtr);
    }
  }

  #requireReady(): CspiceModule {
    if (!this.#mod) throw new CspiceNotReadyError();
    return this.#mod;
  }

  computeMoon(jd: number): BodyPosition {
    return this.#compute("MOON", jd);
  }

  computeSun(jd: number): BodyPosition {
    return this.#compute("SUN", jd);
  }

  #compute(target: string, jd: number): BodyPosition {
    const mod = this.#requireReady();

    const utc = jdToUtcString(jd);
    const utcPtr = writeCString(mod, utc);
    const etPtr = mod._malloc(8);
    mod._str2et_c(utcPtr, etPtr);
    const et = mod.getValue(etPtr, "double");
    mod._free(utcPtr);
    mod._free(etPtr);

    const targPtr = writeCString(mod, target);
    const obsPtr = writeCString(mod, "EARTH");
    const refPtr = writeCString(mod, "J2000");
    const abcorrPtr = writeCString(mod, "NONE");
    const statePtr = mod._malloc(48);
    const ltPtr = mod._malloc(8);
    mod._spkezr_c(targPtr, et, refPtr, abcorrPtr, obsPtr, statePtr, ltPtr);

    const x = mod.getValue(statePtr, "double");
    const y = mod.getValue(statePtr + 8, "double");
    const z = mod.getValue(statePtr + 16, "double");

    mod._free(targPtr);
    mod._free(obsPtr);
    mod._free(refPtr);
    mod._free(abcorrPtr);
    mod._free(statePtr);
    mod._free(ltPtr);

    const r = Math.sqrt(x * x + y * y + z * z);
    let lambda = Math.atan2(y, x) * (180 / Math.PI);
    if (lambda < 0) lambda += 360;
    return {
      lambda,
      beta: Math.asin(z / r) * (180 / Math.PI),
      r,
    };
  }
}

export const cspice = new CspiceEngine();
