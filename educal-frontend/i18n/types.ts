import { pt } from "./pt";

export type Dictionary = typeof pt;

// This generic type extracts all valid dot-notation paths from the Dictionary type
type PathImpl<T, K extends keyof T> =
  K extends string
    ? T[K] extends Record<string, unknown>
      ? K | `${K}.${PathImpl<T[K], Extract<keyof T[K], string>>}`
      : K
    : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

export type TranslationKey = PathImpl2<Dictionary>;
