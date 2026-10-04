export interface BodyPosition {
  lambda: number;
  beta: number;
  r: number;
}

/** CSPICE aberration-correction flag used when reading a body state. */
export type AberrationCorrection = "NONE" | "CN+S";

export interface CspiceModule {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
  };
  _malloc(size: number): number;
  _free(ptr: number): void;
  _furnsh_c(pathPtr: number): void;
  _str2et_c(utcPtr: number, etPtr: number): void;
  _spkezr_c(
    targPtr: number,
    et: number,
    refPtr: number,
    abcorrPtr: number,
    obsPtr: number,
    statePtr: number,
    ltPtr: number,
  ): void;
  getValue(ptr: number, type: "double"): number;
  setValue(ptr: number, value: number, type: "i8"): void;
  stringToUTF8(str: string, ptr: number, maxBytes: number): void;
}