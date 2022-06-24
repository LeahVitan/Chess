import { Filter } from './Board.js'
import { bitPositions } from './Util.js'

export function generateAttackDefendMap (position: bigint, allMoves: bigint, pieces: bigint): bigint {
  const intersections = pieces & allMoves
  const positions = bitPositions(intersections)
  const rank = position / 8n
  const file = position % 8n
  const ranks = positions.map(pos => pos / 8n)
  const files = positions.map(pos => pos % 8n)
  const blocked = positions.map((p, i) => {
    const rankDiff = Math.sign(Number(ranks[i] - rank))
    const fileDiff = Math.sign(Number(files[i] - file))
    const rankFilter = Array((7 - rankDiff * Number(ranks[i])) % 7).fill(undefined)
      .map((_, j) => Filter.Ranks[(j + 1) * rankDiff + Number(ranks[i])])
      .reduce((a, b) => a | b, rankDiff === 0 ? Filter.Ranks[Number(ranks[i])] : 0n)
    const fileFilter = Array((7 - fileDiff * Number(files[i])) % 7).fill(undefined)
      .map((_, j) => Filter.Files[(j + 1) * fileDiff + Number(files[i])])
      .reduce((a, b) => a | b, fileDiff === 0 ? Filter.Files[Number(files[i])] : 0n)
    return rankFilter & fileFilter
  }).reduce((a, b) => a | b, 0n) & allMoves
  return blocked ^ allMoves
}

export function generatePseudoLegalMoves (position: bigint, allMoves: bigint, alliedPieces: bigint, enemyPieces: bigint): bigint {
  const attackDefend = generateAttackDefendMap(position, allMoves, alliedPieces | enemyPieces)
  return attackDefend ^ (attackDefend & alliedPieces)
}

export function generateQuietMoves (position: bigint, allMoves: bigint, alliedPieces: bigint, enemyPieces: bigint): bigint {
  const pseudoLegal = generatePseudoLegalMoves(position, allMoves, alliedPieces, enemyPieces)
  return pseudoLegal ^ (pseudoLegal & enemyPieces)
}

export function generateCaptures (position: bigint, allMoves: bigint, alliedPieces: bigint, enemyPieces: bigint): bigint {
  return generatePseudoLegalMoves(position, allMoves, alliedPieces, enemyPieces) & enemyPieces
}
