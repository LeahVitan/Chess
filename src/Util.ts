import * as crypto from 'crypto'

export const init = <T>(v: T, fallback: T, predicate = (v: T) => v === undefined): T => predicate(v) ? fallback : v

export const nextHash = ((generator) => () => generator.next().value)((
  function * (algorithm, size) {
    let i = 3200
    while (true) yield BigInt(`0x${crypto.createHash(algorithm).update(String(i++)).digest('hex').slice(-size)}`)
  }
)('sha3-512', 128 / 16))

export const popCount = (num: bigint): number => {
  let c = 0
  while (num > 0) {
    num &= num - 1n
    c++
  }
  return c
}

export const bitPositions = (num: bigint): Array<bigint> => {
  const indices: Array<bigint> = []
  for (let i = 0n; i < 64n; i++) {
    if ((num & 2n ** i) !== 0n) indices.push(i)
  }
  return indices
}

export const printDebugTbl = (arr: Array<bigint>): void => console.log(...Array
  .from(arr)
  .map(num => '\n' + num.toString(2).padStart(64, '0').split(/(?=(?:[01]{8})+$)/).join('\n') + '\n'))
