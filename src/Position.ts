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
 *                   =========== Risk Assessment ==========
 *
 * Firstly, there is the idea of going into sharp lines hoping the opponent
 *  makes a mistake. If a refutation is found, it doesn't cause an automatic
 *  cutoff like in alpha-beta pruning. Instead, the engine does a risk
 *  calculation, which may mean keeping "bad" moves in the search tree a little
 *  longer than other engines would.
 *
 *                       --------- Naturality --------
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
 *                       ---------- Respect ----------
 *
 * A refutation may not lead to a direct advantage, requiring the player to
 *  play many correct moves in a row. Unless the player knows the line they're
 *  going into, it's likely they'll make a mistake. But if they do know the
 *  line, you better make sure you want to see it through!
 * In other words, in tricky positions, it's very important to know your
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
 *
 *                   ========== Positional Play ==========
 *
 * The evaluation of a position based on material on the board is relatively
 *  straight-forward. Each piece has a base value which is modified by things
 *  such as piece-square tables, mobility, pair bonus / penalty, material
 *  imbalance bonus / penalty, insufficient material penalty, etc.
 * That might seem like a lot of things that can all affect the value of a
 *  piece, but they only require looking at the current position and can be
 *  very quickly added or multiplied together.
 *
 *                       ---------- Outposts ---------
 *
 * Control of squares on the opponent's side of the board increases the
 *  evaluation of a position. Whether those squares are only under attack or
 *  actually have a piece on them doesn't matter, though of course placing a
 *  piece there would mean even more control of enemy territory.
 * When actually placing a piece in an outpost, the security of that piece is
 *  also important. Safe pieces in enemy territory therefore get a bonus. The
 *  fewer enemy pieces that can create an attack on an outposted piece, the
 *  bigger the bonus gets. The lower the value of the piece that can
 *  potentially create an attack when compared to the outposted piece, the more
 *  severely it reduces the bonus. For example, an outposted queen that can be
 *  attacked by a pawn is pretty pointless, and the evaluation will reflect
 *  that.
 *
 * Aside from simply rewarding play that controls the other side of the board,
 *  special attention is also given to the location of the king. The file, rank
 *  and diagonal on which the enemy king is located get a bonus for being
 *  controlled. The other files, ranks and diagonals get a bonus that gets
 *  exponentially smaller as they get further away from the king. This is meant
 *  to encourage attacks aimed in the general direction of the enemy king
 *  without necessarily striking at the king directly.
 * (As an aside, there is also an extra bonus for controlling squares in a 3x3
 *  area centred on the enemy king, since reducing the mobility of the king
 *  makes it easier to create a mating attack. That has little to do with
 *  outposts though, so let's move on.)
 * The bonus for a diagonal decreases the more opportunities there are for
 *  pawns to block it. Similarly, the bonus for a file decreases if it contains
 *  a pawn (especially a same-coloured pawn). This has to do with mobility
 *  issues faced by rooks and bishops: bishops are each restricted to one
 *  square color and can't easily maneuver or get around a blocking piece,
 *  while pawns can't move sideways to get out of a rook's way. This means that
 *  it's easy for rooks and bishops to be useless even if they're pointing
 *  right at the enemy king.
 * Since this concerns the ability to easily create an attack from an outpost,
 *  this bonus doesn't apply to controlling squares in the engine's own
 *  territory. Instead, it gradually ramps up as those squares get closer to
 *  the enemy position. This bonus may also take into account piece position
 *  and density so that it recognises that what can be considered the "enemy
 *  position" can change, and awards the appropriate bonus when this occurs.
 *
 * All of this is to say that creating safe squares for your pieces where they
 *  can attack the enemy position or the enemy king is very much encouraged by
 *  the evaluation function.
 *
 *                       ----------- Files -----------
 *
 * A rook is valued slightly higher if it's sitting on an open or half-open
 *  file.
 *
 * A half-open or open file itself is not encouraged, however, and comes with a
 *  slight penalty.
 *
 *                       ------ Pawn Structure -------
 *
 * A pawn is valued slightly higher if there are no enemy pawns on adjacent
 *  files, and a decent amount higher if no other pawns directly ahead. This is
 *  done in order to reward making a passed pawn.
 *
 * Pawns are worth more if they're defending another pawn. If there are no
 *  same-coloured pawns on adjacent files whatsoever, they get a penalty. If
 *  they are undefended, they're also worth a little less. The goal is to
 *  reward creating a pawn structure and to punish overextending and creating
 *  isolated pawns.
 *
 *                       -------- King Safety --------
 *
 * A position is valued higher if there are same-coloured pawns above the king.
 *  This bonus fades very quickly as pawns move too far ahead.
 * On the other hand, a position is valued lower is there are opposite-coloured
 *  pawns above the king, since that means the opponent is using those pawns to
 *  try to dismantle the pawn shield.
 *
 * When looking at all the squares a king could reach if he were replaced with
 *  another piece, any undefended squares give a penalty. This penalty is
 *  applied for each piece that can make such a move (except bishops, of which
 *  only the ones moving on the king's current square colour are counted).
 * For example, the penalty for the king sitting on an open file that enemy
 *  pieces can easily more to, may be applied once for the queen and twice for
 *  the rooks. If the opponent loses a rook, it's only applied once for the
 *  rooks.
 * An extra penalty is applied for each of those moves if they immediately
 *  result in mate, since those weaknesses are the most urgent to cover.
 *
 * A position is also evaluated lower if any of the squares in a 3x3 area
 *  around the king are under attack. This is due to the value boost enemy
 *  pieces receive for attacking those squares.
 *
 * A position with castling availability is usually evaluated a decent amount
 *  higher. For each side that the engine can castle, a basic king safety
 *  evaluation is run after castling. King safety is decreased slightly for
 *  every enemy piece that is attacking the squares the king must move over or
 *  onto, as well as every piece that is blocking those squares.
 * The two highest king safety values (including of the current position) are
 *  averaged, and a weighted average with the king safety of the current
 *  position is taken.
 * To prevent the engine from being averse to castling, the king is valued less
 *  on its starting position during the opening and early middle-game, even
 *  though it's on the back rank where the king likes to be.
 *
 *                       ----------- Tempo -----------
 *
 * A position is evaluated as slightly worse if the opponent is to move. Since
 *  the engine flips the board these positions are a bit harder to read from
 *  transposition tables, but they can be recognised by using null-moves.
 * If a position is read from a transposition table but the side to play is the
 *  opponent, a penalty is applied to the evaluation to help enforce this
 *  principle without having to do any further computation.
 * There are some cases where not having to move gives some sort of advantage,
 *  but this is mostly limited to endgames, so the strength of this penalty is
 *  correlated with the amount of pieces on the board.
 *
 *                   =========== Tactical Play ===========
 *
 * Some of the first moves the engine will be looking at during search and
 *  evaluation will be tactical moves, due to their ability to change the
 *  position a lot either for better or worse.
 *
 *                   =========== Transposition ===========
 *
 * The engine will use transposition tables. All that's stored in them are the
 *  pieces, EP square, and castling rights. Things like respect / contempt
 *  factor are not included, with the rationale that if two different sequences
 *  of moves led to the exact same position, the difference in playing strength
 *  can't have been especially large.
 *
 * Since the engine flips the board rather than having an internal concept of
 *  making moves for the opponent, the transposition table is slightly more
 *  efficient. For example, after storing the position of 1. e4 c5 in the
 *  transposition table, it will also recognise that position if reached via
 *  1. c3 e5 2. c4, even though the position is entirely reversed.
 * 
 *                   ========== Search Algorithm =========
 * 
 * Because of the risk assessment feature, alpha-beta pruning can't be used
 *  without modification, so this section is dedicated to exploring solutions
 *  to this problem.
 * 
 * The main issue is that risking a bad position may be a worthwhile move if it
 *  catches the opponent off guard by forcing them into a line they don't know
 *  well.
 * To evaluate whether this is worthwhile, the engine needs to know what the
 *  eventual evaluation it's hoping for is, what the evaluation is if the
 *  opponent spots a refutation, and the playing strength at which the engine
 *  thinks the opponent will see that refutation.
 * This works as follows: the engine assumes it will reach the position it's
 *  hoping for, starting with that evaluation. It then uses an estimate of the
 *  opponent's current playing strength (the "respect" metric above) divided by
 *  the playing strength at which it's not worth it, as an interpolation weight
 *  between the good and bad position to reach the evaluation on which to base
 *  the cutoff.
 * There is one further issue here, though: the engine can't calculate a good
 *  "good", "bad", and "risk" evaluation without looking deeper. So the closer
 *  the engine gets to its depth limit, the less meaningful those values will
 *  be. The entire point here is to avoid early cutoffs for dubious but tricky
 *  lines, so if it can't see the difference between taking a risk and making a
 *  blunder, the whole process is useless.
 * This means the engine needs to perform a deeper but more limited search,
 *  similar to a quiescence search, to find the true evaluation of a position.
 * 
 *                       -------- Risk Search --------
 * 
 * Since we can make no quiescence assumptions when calculating risk, we can't
 *  prune the risk tree in the same way, meaning that to be more effective, we
 *  need to evaluate positions more quickly, and prune more aggressively.
 * 
 * One optimisation we can make in general is to assume that the opponent won't
 *  take risks. Since the engine can calculate the line it needs to follow, we
 *  can assume it follows the correct line and thus that we can always punish
 *  the opponent if they take a risk, meaning it's not necessary to search a
 *  "risky" move by the opponent any deeper than the first refutation we find.
 * Similarly, we don't need to evaluate the opinion the opponent has of the
 *  engine's playing strength, either. If taking risks doesn't matter, neither
 *  does respect.
 * We can additionally assume during this limited search that the engine will
 *  take no further risks. This may not be accurate, and the engine may reach
 *  a better evaluation if it does take another risk, but we don't really need
 *  to know about that at this point. It could change the evaluation a little,
 *  but going without further dubious moves is a good enough target to
 *  calculate risk from.
 * 
 * Something else we can assume is that the opponent will always see refutation
 *  moves that are more natural than any move that got them to this point. Even
 *  if the move itself is weak, so long at it beats the evaluation of the
 *  position we do our risk search from, we can establish a lower bound on
 *  evaluation for this move and for risk on subsequent ones, i.e. the opponent
 *  will not make weaker moves than this one, and their estimated strength will
 *  not diminish.
 * 
 * Another assumption we can make is that if there were any better moves for
 *  the opponent earlier on, the opponent will not make moves that are any less
 *  natural than the most natural one in that set, even if they are better. 
 *  This is a lower bound on the naturality of moves, which can limit the
 *  amount we need to search greatly. For example, we can prune the entire
 *  branch if all of the good moves available are less natural than a
 *  previously missed move that was better.
 * 
 * All the extra work done in establishing risk isn't useless. Any encountered
 *  positions can be stored in a transposition table and help with move
 *  ordering and potentially with evaluation.
 * 
 *                       ---- Iterative Deepening ----
 * 
 * It's yet to be seen whether iterative deepening is worth it in a scenario
 *  where the search tree can't be pruned as aggressively as with alpha-beta.
 * It may be worth it only during risk searches or quiescence searches, but
 *  perhaps not during a general search.
 * 
 * Another idea is to modify the iterative deepening algorithm. Rather than
 *  start over every time, perhaps a node is only revisited if the best move
 *  changes. This would work as follows:
 * First, a temporary evaluation is given to a position in typical minimax
 *  fashion, i.e. its best move is used. Then the preceding move gets that
 *  evaluation. This value propagates up the search tree, and any time this
 *  causes an upset, that position becomes "dirty".
 * After the value has propagated back up, a new search starts at the highest
 *  "dirty" node rather than going deeper. From there, all non-dirty nodes are
 *  skipped, i.e. because the move didn't cause an upset there it's assumed
 *  that the position was unaffected. After a dirty node is re-evaluated, it
 *  ceases to be dirty. Any further upsets caused will once again trigger a new
 *  search. This goes on until no more nodes are dirty.
 * After this, the normal search resumes, but using the insights gained by the
 *  above re-evaluation for move ordering.
 * The advantage of this idea is that most nodes are usually skipped when a new
 *  search happens, which offsets a lot of the problems an algorithm like
 *  iterative deepening has when the search tree can't be pruned efficiently.
 * 
 * Another idea is to group all nodes of a certain depth together. Some of them
 *  will have been pruned so they don't need to be included. These positions
 *  are ordered from best to worst and searched in that order. This is more or
 *  less just a breath-first search but with some depth-first characteristics
 *  to eliminate the worst moves.
 * Since this search is breadth-first, iterative deepening is a lot less
 *  useful.
 * 
 * Lastly it may be possible to group all nodes to be searched regardless of
 *  depth. This idea is similar to the above, but doesn't iterate on the search
 *  tree at all. Instead it takes the best single node (or maybe a few?) from
 *  a priority queue and evaluates it, adding most follow-up moves into a
 *  second queue (one for each player). It goes back and forth between the two
 *  queues.
 * If a major upset is caused in evaluation due to a deep refutation, this
 *  evaluation propagates upward through the search tree, which may prune or
 *  un-prune certain moves from the priority queues.
 * Pruning is less aggressive, but it should still prevent the engine from
 *  pointlessly calculating good moves resulting from terrible lines. Taking a
 *  few items from the queue at a time also means it will evaluate positions
 *  that are not always ideal, but still worthwhile to look at using the risk
 *  assessment algorithm.
 * Because nodes can be easily pruned or un-pruned from the queue, causing the
 *  algorithm to skip them, any big upsets will cause only a very minimal
 *  impact to the way it runs and looks at positions.
 * This approach is of course not very compatible with iterative deepening.
 * 
 */

class Search {

}
