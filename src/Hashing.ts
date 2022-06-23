import { ChessBoard } from './Board.js'
import { nextHash } from './Util.js'

const hashArray = (length: number): Array<bigint> => Array(length).fill(undefined).map(() => nextHash())

export const blackToMove = nextHash()
export const enPassantFile = hashArray(8)
export const castling = hashArray(16)
export const pieces: Array<Array<bigint>> = []
pieces[ChessBoard.Color.White | ChessBoard.Piece.King * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.King * 2] = hashArray(64)
pieces[ChessBoard.Color.White | ChessBoard.Piece.Queen * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.Queen * 2] = hashArray(64)
pieces[ChessBoard.Color.White | ChessBoard.Piece.Bishop * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.Bishop * 2] = hashArray(64)
pieces[ChessBoard.Color.White | ChessBoard.Piece.Knight * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.Knight * 2] = hashArray(64)
pieces[ChessBoard.Color.White | ChessBoard.Piece.Rook * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.Rook * 2] = hashArray(64)
pieces[ChessBoard.Color.White | ChessBoard.Piece.Pawn * 2] = hashArray(64)
pieces[ChessBoard.Color.Black | ChessBoard.Piece.Pawn * 2] = hashArray(64)
