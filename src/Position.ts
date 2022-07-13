export enum CastlingRights {
  K = 1, Q = 2,
  k = 4, q = 8,
}

/// TODO: make piece values dependent on game.
export const PieceValues = {
  P: 100,
  N: 300,
  B: 300,
  R: 500,
  Q: 900,
  K: 400
}

export enum Directions {
  N = -10,
  E = -1,
  S = 10,
  W = 1
}

export const PieceMoves = ((N, E, S, W) => ({
  P: [N, N + N, N + W, N + E],
  N: [N + N + E, E + N + E, E + S + E, S + S + E, S + S + W, W + S + W, W + N + W, N + N + W],
  B: [N + E, S + E, S + W, N + W],
  R: [N, E, S, W],
  Q: [N, E, S, W, N + E, S + E, S + W, N + W],
  K: [N, E, S, W, N + E, S + E, S + W, N + W]
}))(Directions.N, Directions.E, Directions.S, Directions.W)

export class Position {
  public board: string
  public evaluation: number
  public castlingRights: number

  public constructor (board: string, evaluation: number, cr: number) {
    this.board = board
    this.evaluation = evaluation
    this.castlingRights = cr
  }

  public generateMoves () {}
  public rotate () {}
  /// TODO: allow passing null for a null-move, which rotates the board and clears the en passant square
  public move () {}
  public evaluate () {}
}
