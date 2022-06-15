import { Board } from '../board/Board'
import { Pieces, Players } from './Pieces'

const Fields = {
  Pieces: 0,
  ToMove: 1,
  CanCastle: 2,
  EnPassant: 3,
  HalfMove: 4,
  FullMove: 5
}

const firstFile = 'a'.codePointAt(0)
const CastleSquares = (length => ({
  Q: 0,
  K: length - 1,
  q: length ** 2 - length,
  k: length ** 2 - 1
}))(8)

const fenError = (...reason) => { throw new Error(`Invalid FEN string: ${reason.join(' ')}`) }

export const FEN = new (class {
  static parse (string) {
    const fields = string.split(' ')
    const board = new Board()

    // Check for errors
    if (fields.length !== 6) fenError('Incorrect amout of fields; expected', 6, 'but received', fields.length)

    // Add pieces
    board.pieces = []
    fields[Fields.Pieces].split('/').reverse().join('').split('').forEach(chr => {
      if (!isNaN(Number(chr))) {
        board.pieces.push(...Array(Number(chr)).fill(0))
      } else {
        const piece = Pieces[chr.toLowerCase()] | (/[A-Z]/.test(chr) ? Players.w : Players.b)
        if (isNaN(piece)) fenError('Unknown piece:', chr)
        board.pieces.push(piece)
      }
    })

    // Add active player
    board.toMove = Players[fields[Fields.ToMove]]

    // Add castling
    board.canCastle = new Map([[Players.w, new Set()], [Players.b, new Set()]])
    if (fields[Fields.CanCastle] !== '-') {
      fields[Fields.CanCastle].split('').forEach(chr => {
        if (CastleSquares[chr] === undefined) fenError('Unknown castling side:', chr)
        board.canCastle
          .get(/[A-Z]/.test(chr) ? Players.w : Players.b)
          .add(CastleSquares[chr])
      })
    }

    // Add en passant
    if (fields[Fields.EnPassant] !== '-') {
      const square = fields[Fields.EnPassant]
      if (square.length !== 2) fenError('Unknown square:', square)
      if (!'abcdefgh'.split('').includes(square[0])) fenError('Unknown file:', square[0])
      if (Number(square[1]) < 1 || Number(square[1]) > 8) fenError('Unknown rank:', square[1])
      board.enPassant = (Number(square[1]) - 1) * 8 + square.codePointAt(0) - firstFile
    }

    // Add halfmove & fullmove
    board.plyClock = Number(fields[Fields.HalfMove])
    if (isNaN(board.plyClock)) fenError('Not a number:', fields[Fields.HalfMove])
    if (board.plyClock < 0) fenError('Invalid halfmove number', fields[Fields.HalfMove])

    board.fullMove = Number(fields[Fields.FullMove])
    if (isNaN(board.fullMove)) fenError('Not a number:', fields[Fields.HalfMove])
    if (board.fullMove < 1) fenError('Invalid fullmove number', fields[Fields.HalfMove])

    return board
  }
})()

export const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export default FEN
