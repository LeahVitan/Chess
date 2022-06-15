
import { fallback } from '../util/Util.js'

/* class Board {
  constructor (size, pieces = Pieces, players = Players) {
    this.squares = Array(size).fill(Array(size).fill().map(() => Symbol('')))
    this.pieces = Array(size).fill(Array(size).fill(0))
    this.players = Array(size).fill(Array(size).fill(0))
    this.pieceCache = new Map()
    this.playerCache = new Map()
    Object.values(pieces).map(v => this.pieceCache.set(v, new Set()))
    Object.values(players).map(v => this.playerCache.set(v, new Set()))
  }

  setPiece (file, rank, player, piece) {
    const square = this.squares[file][rank]
    this.pieceCache.forEach(v => v.delete(square))
    this.playerCache.forEach(v => v.delete(square))
    this.pieces[file][rank] = piece
    this.players[file][rank] = player
    this.pieceCache.get(piece).add(square)
    this.playerCache.get(player).add(square)
  }

  getPiece (file, rank) { return this.pieces[file][rank] }
  getPlayer (file, rank) { return this.players[file][rank] }
} */

export function Board (init) {
  this.pieces = fallback(init.pieces, [])
  this.toMove = fallback(init.toMove, 0)
  this.canCastle = fallback(init.canCastle, new Map())
  this.enPassant = fallback(init.enPassant, null)
  this.plyClock = fallback(init.plyClock, 0)
  this.fullMove = fallback(init.fullMove, 1)
}

/* static from (array) {
  const instance = new Board(Math.sqrt(array.length))
  instance.board = Array.from(array)
  return instance
} */
