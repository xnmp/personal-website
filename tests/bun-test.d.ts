// Minimal ambient types for the bun:test runner (bun-types is not installed).
// Loose by design — just enough for tsc --noEmit to resolve the test imports.
declare module "bun:test" {
  type TestFn = () => void | Promise<void>;
  export const test: (name: string, fn: TestFn, timeout?: number) => void;
  export const describe: ((name: string, fn: () => void) => void) & {
    /** one describe per case; %s in the name is the case */
    each: <T>(cases: readonly T[]) => (name: string, fn: (c: T) => void) => void;
  };
  /** the optional message heads the failure */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const expect: (value: any, message?: string) => any;
}
