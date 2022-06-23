let i = 0n
const Squares = {
  a1: i++, a2: i++, a3: i++, a4: i++, a5: i++, a6: i++, a7: i++, a8: i++,
  b1: i++, b2: i++, b3: i++, b4: i++, b5: i++, b6: i++, b7: i++, b8: i++,
  c1: i++, c2: i++, c3: i++, c4: i++, c5: i++, c6: i++, c7: i++, c8: i++,
  d1: i++, d2: i++, d3: i++, d4: i++, d5: i++, d6: i++, d7: i++, d8: i++,
  e1: i++, e2: i++, e3: i++, e4: i++, e5: i++, e6: i++, e7: i++, e8: i++,
  f1: i++, f2: i++, f3: i++, f4: i++, f5: i++, f6: i++, f7: i++, f8: i++,
  g1: i++, g2: i++, g3: i++, g4: i++, g5: i++, g6: i++, g7: i++, g8: i++,
  h1: i++, h2: i++, h3: i++, h4: i++, h5: i++, h6: i++, h7: i++, h8: i++,
}

const Files = [
  72340172838076671n,
  144680345676153346n,
  289360691352306692n,
  578721382704613384n,
  1157442765409226768n,
  2314885530818453536n,
  4629771061636907072n,
  9259542123273814144n,
]

const Ranks = [
  255n,
  65280n,
  16711680n,
  4278190080n,
  1095216660480n,
  280375465082880n,
  71776119061217280n,
  18374686479671623680n
]

const Misc = {
  diagonal: 9241421688590303745n,
  antidiagonal: 72624976668147840n,
  lightSquares: 6172840429334713770n,
  darkSquares: 12273903644374837845n,
}

/**
 * Little-endian rank-file mapping filters
 */
export const Filter = { Squares, Files, Ranks, Misc }

/**
 * Little-endian rank-file mapping relative coordinates
 */
export const Directions = {
  NW: 7n, N: 8n, NE: 9n,
  W: -1n, E: 1n,
  SW: -9n, S: -8n, SE: -7n,
}

enum Color {
  White,
  Black,
}

enum Piece {
  Rook,
  Knight,
  Bishop,
  Queen,
  King,
  Pawn
}

export class ChessBoard {
  public move: number = 1
  public halfMoveClock: number = 0
  public enPassant: number = NaN
  public canCastle: number = 8

  /**
   * One bitboard per colour, and one bitboard per piece.
   * Using bitwise AND, a specific piece with a specific colour can be
   *  obtained.
   */
  public pieces: BigUint64Array = new BigUint64Array(8)

  /**
   * One bitboard for each piece on the board, indexed by square.
   * Contains all squares that are attacked or defended by this piece.
   * The length cannot be hardcoded because of the possibility of promotion.
   */
  public attackMap: Map<number, BigInt> = new Map()

  /**
   * One bitboard for each piece on the board, indexed by square.
   * Contains all squares a piece could potentially reach from its current
   *  position. Useful for detecting discovered attacks, checks, and defences,
   *  and by extension pins and skewers.
   * The length cannot be hardcoded because of the possibility of promotion.
   * Cannot be joined with the attack/defence maps because pawns attack
   *  differently than they move.
   */
  public pseudoLegalMoves: Map<number, BigInt> = new Map()

  static Piece: typeof Piece = Piece
  static Color: typeof Color = Color
}