import * as crypto from 'crypto'

export const init = <T>(v: T, fallback: T, predicate = (v: T) => v === undefined): T => predicate(v) ? fallback : v

export const nextHash = ((generator) => () => generator.next().value)((
  function * (algorithm, size) {
    let i = 3200
    while (true) yield BigInt(`0x${crypto.createHash(algorithm).update(String(i++)).digest('hex').slice(-size) as string}`)
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
