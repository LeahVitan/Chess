import { init } from './Util.js'

const rankNums = ['1', '2', '3', '4', '5', '6', '7', '8']
const fileChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const Squares = new BigUint64Array(64).fill(0n).reduce<Object>((acc, _, cur) => {
  acc[fileChars[cur % 8] + rankNums[Math.floor(cur / 8)]] = 2n ** BigInt(cur)
  return acc
}, {})

const Files = BigUint64Array.from([
  0x0101010101010101n,
  0x0202020202020202n,
  0x0404040404040404n,
  0x0808080808080808n,
  0x1010101010101010n,
  0x2020202020202020n,
  0x4040404040404040n,
  0x8080808080808080n
])

const Ranks = BigUint64Array.from([
  0x00000000000000ffn,
  0x000000000000ff00n,
  0x0000000000ff0000n,
  0x00000000ff000000n,
  0x000000ff00000000n,
  0x0000ff0000000000n,
  0x00ff000000000000n,
  0xff00000000000000n
])

const Misc = {
  diagonal: 0x8040201008040201n,
  antidiag: 0x0102040810204080n,
  lSquares: 0x55aa55aa55aa55aan,
  dSquares: 0xaa55aa55aa55aa55n
}

/**
 * Little-endian rank-file mapping filters
 */
export const Filter = { Squares, Files, Ranks, Misc }

/**
 * Little-endian rank-file mapping relative coordinates
 */
export const Directions = {
  /* eslint-disable object-property-newline, no-multi-spaces, key-spacing */
  NW:  7n, N:  8n, NE:  9n,
  W:  -1n,         E:   1n,
  SW: -9n, S: -8n, SE: -7n
  /* eslint-enable object-property-newline, no-multi-spaces, key-spacing */
}

enum Color { White, Black }
enum Piece { Rook, Knight, Bishop, Queen, King, Pawn }
enum Castle { KQkq, KQk, KQq, KQ, Kkq, Kk, Kq, K, Qkq, Qk, Qq, Q, kq, k, q, ''}

/**
 * Chess board representation.
 */
export class ChessBoard {
  public move: number = 1
  public halfMoveClock: number = 0
  public enPassant: number = NaN
  public canCastle: Castle = Castle.KQkq
  static Piece: typeof Piece = Piece
  static Color: typeof Color = Color
  static Castle: typeof Castle = Castle

  /**
   * One bitboard per colour, and one bitboard per piece.
   * Using bitwise AND, a specific piece with a specific colour can be
   *  obtained.
   */
  public pieces: BigUint64Array = new BigUint64Array(8)

  /**
   * Union of all piece bitboards, updated incrementally in tandem with the
   *  piece bitboards.
   */
  public occupancy: bigint = 0n

  /**
   * Flips the bitboard vertically.
   * @param board - the bitboard to flip
   * @returns the new bitboard
   */
  static flip (board: bigint): bigint {
    const v1 = 0x00ff00ff00ff00ffn
    const v2 = 0x0000ffff0000ffffn
    board = ((board >> 8n) & v1) | ((board & v1) << 8n)
    board = ((board >> 16n) & v2) | ((board & v2) << 16n)
    board = (board >> 32n) | (board << 32n)
    return board
  }

  /**
   * Mirrors the bitboard horizontally.
   * @param board - the bitboard to mirror
   * @returns the new bitboard
   */
  static mirror (board: bigint): bigint {
    const h1 = 0x5555555555555555n
    const h2 = 0x3333333333333333n
    const h4 = 0x0f0f0f0f0f0f0f0fn
    board = ((board >> 1n) & h1) + 2n * (board & h1)
    board = ((board >> 2n) & h2) + 4n * (board & h2)
    board = ((board >> 4n) & h4) + 16n * (board & h4)
    return board
  }

  /**
   * Rotates the bitboard by 180 degrees.
   * @param board - the bitboard to rotate
   * @returns the new bitboard
   */
  static rotate180 (board: bigint): bigint {
    return this.mirror(this.flip(board))
  }
}

/**
 * Rook moves can be defined as all squares on the same rank XOR the same file.
 */
const rookMoves = new BigUint64Array(64)
  .fill(0n)
  .map((_, origin) => Files[origin % 8] ^ Ranks[Math.floor(origin / 8)])

/**
 * Bishop moves are determined by following the diagonals. Not sure whether
 *  there's a more elegant way to do this, but computation is frontloaded so it
 *  luckily doesn't really matter.
 */
const bishopMoves = new BigUint64Array(64)
  .fill(0n)
  .map((_, origin) => {
    const rank = Math.floor(origin / 8)
    const file = origin % 8
    return [
      ...Array(Math.min(7 - rank, file)).fill(Directions.NW).map((v, i) => BigInt(origin) + v * BigInt(i + 1)),
      ...Array(7 - Math.max(rank, file)).fill(Directions.NE).map((v, i) => BigInt(origin) + v * BigInt(i + 1)),
      ...Array(Math.min(rank, file)).fill(Directions.SW).map((v, i) => BigInt(origin) + v * BigInt(i + 1)),
      ...Array(Math.min(rank, 7 - file)).fill(Directions.SE).map((v, i) => BigInt(origin) + v * BigInt(i + 1))
    ].map(v => 2n ** v).reduce((a, b) => a | b)
  })

/**
 * Queen moves are really just rook moves OR bishop moves, so this was easy.
 */
const queenMoves = rookMoves.map((board, i) => board | bishopMoves[i])

/**
 * King moves are a 3x3 area centred around the original position, but
 *  excluding the origin square (to disallow null-moves). So it's just all
 *  squares within 1 file AND 1 rank, XOR the current position.
 * Castling is also included, since the point of pseudolegal moves is to only
 *  have to rule out moves rather than generate any new ones, but I found
 *  this easier to implement further below rather than here.
 */
const kingMoves = new BigUint64Array(64)
  .fill(0n)
  .map((_, origin) =>
    (
      Files[origin % 8] |
      init(Files[origin % 8 - 1], 0n) |
      init(Files[origin % 8 + 1], 0n)
    ) & (
      Ranks[Math.floor(origin / 8)] |
      init(Ranks[Math.floor(origin / 8) - 1], 0n) |
      init(Ranks[Math.floor(origin / 8) + 1], 0n)
    ) ^ 2n ** BigInt(origin))

/**
 * Knight moves are 1 file AND 2 ranks away, OR 2 files AND 1 rank. So this is
 *  pretty straightforward.
 */
const knightMoves = new BigUint64Array(64)
  .fill(0n)
  .map((_, origin) =>
    (init(Files[origin % 8 - 1], 0n) | init(Files[origin % 8 + 1], 0n)) &
    (init(Ranks[Math.floor(origin / 8) - 2], 0n) | init(Ranks[Math.floor(origin / 8) + 2], 0n)) |
    (init(Files[origin % 8 - 2], 0n) | init(Files[origin % 8 + 2], 0n)) &
    (init(Ranks[Math.floor(origin / 8) - 1], 0n) | init(Ranks[Math.floor(origin / 8) + 1], 0n)))

/**
 * Pawn moves including captures can be defined as forward-only king moves. The
 *  main difference is that on the 2nd rank, they can move 2 spaces forward, so
 *  I'm adding that conditionally.
 * Pawns also don't occur on the 1st and 8th rank, but that just means it
 *  doesn't really matter what those bitboards say. I'm doing a bit of extra
 *  work but it's not going to affect anything.
 */
const pawnMoves = new BigUint64Array(64)
  .fill(0n)
  .map((_, origin) =>
    (Math.floor(origin / 8) === 1 ? 2n ** (BigInt(origin) + Directions.N * 2n) : 0n) |
    init(Ranks[Math.floor(origin / 8) + 1], 0n) & kingMoves[origin])

export const potentialMoves: BigUint64Array[] = []
potentialMoves[Color.White | Piece.King * 2] = kingMoves
  .map((board, origin) => board | (origin === 60 ? 2n ** 58n | 2n ** 62n : 0n))
potentialMoves[Color.Black | Piece.King * 2] = kingMoves
  .map((board, origin) => board | (origin === 4 ? 2n ** 2n | 2n ** 6n : 0n))
potentialMoves[Color.White | Piece.Queen * 2] = queenMoves
potentialMoves[Color.Black | Piece.Queen * 2] = queenMoves
potentialMoves[Color.White | Piece.Bishop * 2] = bishopMoves
potentialMoves[Color.Black | Piece.Bishop * 2] = bishopMoves
potentialMoves[Color.White | Piece.Knight * 2] = knightMoves
potentialMoves[Color.Black | Piece.Knight * 2] = knightMoves
potentialMoves[Color.White | Piece.Rook * 2] = rookMoves
potentialMoves[Color.Black | Piece.Rook * 2] = rookMoves
potentialMoves[Color.White | Piece.Pawn * 2] = pawnMoves
potentialMoves[Color.Black | Piece.Pawn * 2] = pawnMoves
  .map(ChessBoard.rotate180).reverse()
