// Minimal ambient types for the bun:test runner (bun-types is not installed).
// Loose by design — just enough for tsc --noEmit to resolve the test imports.
declare module "bun:test" {
  type TestFn = () => void | Promise<void>;
  export const test: (name: string, fn: TestFn, timeout?: number) => void;
  export const describe: (name: string, fn: () => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const expect: (value: any) => any;
}
