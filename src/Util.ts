export const init = <T>(v: T, fallback: T, predicate = (v: T) => v === undefined): T => predicate(v) ? fallback : v
