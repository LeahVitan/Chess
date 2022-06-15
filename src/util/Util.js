export const addField = (...reduceArgs) => (name) => (object) => {
  object[name] = Object
    .getOwnPropertyNames(object)
    .reduce(reduceArgs)
}

export const addMaxField = addField((a, b) => Math.max(a, b), -Infinity)

export const fallback = (value, defaultValue, predicate = v => v !== undefined) =>
  predicate(value) ? value : defaultValue

export const matchAll = (regex, string) => {
  const matches = []
  let match
  while ((match = regex.exec(string))) matches.push(match)
  return matches
}
