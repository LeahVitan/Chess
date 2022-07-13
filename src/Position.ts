/**
 * This code is going to look like Sunfish for a little bit until I've got
 *  something that at least functions, after which I'll be able to revisit
 *  some of the stuff here.
 * The evaluation function is going to be original anyhow, but none of this is
 *  final as it is either.
 * 
 * Sunfish: @see https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 * Custom engine breakdown: @see https://www.naftaliharris.com/blog/chess/
 * Evaluating moves: @see https://www.chessprogramming.org/Evaluation
 * Searching moves: @see https://www.chessprogramming.org/Search
 */

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

  public constructor(board: string, evaluation: number, cr: number) {
    this.board = board
    this.evaluation = evaluation
    this.castlingRights = cr
  }

  public generateMoves() { }
  public rotate() { }
  /// TODO: allow passing null for a null-move, which rotates the board and clears the en passant square
  public move() { }
  public evaluate() { }
}


/**
 * Evaluating and deciding on moves will take several ideas into account.
 * 
 *                  =========== Taking Risks ===========
 * 
 * Firstly, there is the idea of going into sharp lines hoping the opponent
 *  makes a mistake. If a refutation is found, it doesn't cause an automatic
 *  cutoff like in alpha-beta pruning. Instead, the engine does a risk
 *  calculation, which may mean keeping "bad" moves in the search tree a little
 *  longer than other engines would.
 * 
 * When looking for a refutation, unnatural moves are regarded as worse simply
 *  by virtue of being unnatural. That is, if all the refutations the opponent
 *  has available are counterintuitive, the engine may decide that the move is
 *  worth the risk.
 * This is done by assigning a "naturality" score to refutation moves, where
 *  the engine looks at several criteria very briefly such as whether the move
 *  increases piece mobility or the amount of controlled squares, captures a
 *  higher-value or undefended piece, gives a check, forks two pieces,
 *  increases king safety or offers / takes an advantageous or equal trade.
 * All of the factors being examined for a move are weighed against one
 *  another, given a weight and a score which are used to finally give a final
 *  naturality score to the move. For example, for a check which is not a
 *  capture, the naturality criterium for captures will have a weight of 0.
 *  Meanwhile, the naturality criterium for checks will have a high weight if
 *  few checks are available, and a lower one if many are available. The
 *  criterium's actual score depends on whether the responses available lead to
 *  a worse position at a glance.
 * Rather than returning the inverse of the opponent's best evaluation right
 *  away, the engine uses naturality to adjust the results. The evaluation of
 *  all the moves better or equal to some baseline (which is selected to be the
 *  best-evaluating move that reaches some naturality threshold) are
 *  interpolated with it to slightly increase the evaluation to that point in a
 *  way that's consistent with their naturality.
 * Of course, when the best move is entirely natural, this whole process doesn't
 *  matter, so when a refutation is found that meets some naturality threshold
 *  the evaluation is short-circuited so that the branch can be pruned from the
 *  search tree, just as usual.
 * After completing this analysis, the engine stores the objective evaluation,
 *  the naturality-adjusted evaluation, and the naturality of the move.
 * 
 * A refutation may not lead to a direct advantage, requiring the player to
 *  play many correct moves in a row. Unless the player knows the line they're
 *  going into, it's likely they'll make a mistake. But if they do know the
 *  line, you better make sure you want to see it through! 
 * In other words, in tricky positions, it's very important to know your'
 *  opponent. This engine does of course not know its opponent, but it can make
 *  some guesses. These guesses basically boil down to a "contempt factor" but
 *  for taking risks; The more the engine respects the opponent is, the less it
 *  weighs the naturality of a move during evaluation.
 * This "respect" is typically adjusted every time the opponent makes a move,
 *  and consists of a certainty factor and a perceived strength factor.
 * Generally, three moves are of importance for the algorithm the engine uses
 *  to infer its opponent's strength: the move they played (P), the next best
 *  move that is less natural (-N), and the best move that is more natural
 *  (+N).
 * Of course, if P is the best move, the conclusion is simple: the opponent 
 *  will see moves that are of naturality P at least some of the time. This
 *  raises the engine's respect level, but only up to a point. The engine will
 *  still take risks that rely on the opponent missing moves of lower
 *  naturality than P, but it will take risks that rely on the opponent missing
 *  moves of higher naturality than P a lot less.
 * Otherwise, the difference in evaluation between P and -N must be taken into
 *  account. The closer the evaluation, the less certain the engine can be that
 *  the move was actually missed, since either the engine or the opponent could
 *  be a little off in their evaluation, or perhaps the opponent prefers P
 *  because it suits their playstyle. Thus, respect for the opponent is
 *  potentially lowered (if high enough to expect they would see -N), but the
 *  amount by which it is lowered decreases as the evaluation difference does.
 * There is one more move to take into account, namely +N. Unless P == +N, the
 *  opponent likely missed +N despite it being more natural. This means the
 *  engine's certainty will be lowered, and the respect will be nudged towards
 *  the midpoint between P and +N. Once again evaluation is taken into account
 *  as well, meaning that the smaller the difference in evaluation, the less
 *  the respect and certainty will be affected.
 * Generally, certainty will be adjusted based on the estimated probability
 *  that the opponent found a good move with a certain naturality. Certainty is
 *  raised when the engine expected the opponent to find that move. Certainty
 *  is lowered when the engine expected the opponent to miss it. The thresholds
 *  by which the engine derives this expectation can be changed to adjust the
 *  engine's behaviour.
 */
class Search {

}