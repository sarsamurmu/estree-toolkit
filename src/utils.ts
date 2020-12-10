export type Lazy<T> = () => T;
export const lazy = <T>(get: () => T): Lazy<T> => {
  let val: T;
  return () => val || (val = get());
}

export const debugLog = (...data: any[]) => {
  console.log(...data);
}
