import { matchAll } from './Util.js'

const getRegex = () => /(?<mod>[a-z]*)(?<base>(?:[A-Z][0-9]+|([A-Z])\3?|\((?<coord>[0-9]+,[0-9]+)\)(?<dist>[0-9]+)))/gm
/* const getMods = () => ({
  direction: [],
  capture: [],
  hopping: [],
  jumping: [],
  special: [],
  availability: [],
  range: [],
  excite: [],
  other: []
}) */

const atoms = {}

// Basic atoms
atoms.W = parse('(0,1)')
atoms.D = parse('(0,2)')
atoms.H = parse('(0,3)')
atoms.F = parse('(1,1)')
atoms.A = parse('(2,2)')
atoms.G = parse('(3,3)')
atoms.N = parse('(1,2)')
atoms.L = parse('(1,3)')
atoms.J = parse('(2,3)')
atoms.Z = atoms.L
atoms.C = atoms.J

// Compound atoms
atoms.R = parse('WW')
atoms.B = parse('FF')
atoms.Q = parse('WWFF')
atoms.K = parse('WF')

// Special atoms
atoms.O = () => {}
atoms['@'] = () => {}
atoms.U = () => {}
atoms.I = () => {}

export function parse (string) {
  const matches = matchAll(getRegex(), string)
  const moves = []
  matches.forEach(match => {
    const { mod, base, coords, dist } = match

    // No number means it takes one step, repeating the atom means infinite steps
    const limit = dist !== undefined
      ? Number(dist)
      : isNaN(Number(base[1]))
        ? 0
        : base[1] !== undefined
          ? base[1]
          : 1

    // The relative coordinates this piece can move to
    const target = coords !== undefined
      ? coords.split(',').map(Number)
      : atoms[base[0]]

    // The mods for this move
    /* const mods = [getMods()]
    let leg = 0

    mod.split('').forEach(mod => {
      if (/[fblrvsh]/.test(mod)) mods[leg].direction.push(mod)
      else if (/[mcedukt]/.test(mod)) mods[leg].capture.push(mod)
      else if (/[pg]/.test(mod)) mods[leg].hopping.push(mod)
      else if (/[nj]/.test(mod)) mods[leg].jumping.push(mod)
      else if (/[i]/.test(mod)) (leg === 0 ? mods[leg].availability : mods[leg].range).push(mod)
      else if (/[y]/.test(mod)) mods[leg].range.push(mod)
      else if (/[qzo]/.test(mod)) mods[leg].special.push(mod)
      else if (/[x]/.test(mod)) mods[leg].excite.push(mod)
      else if (/[a]/.test(mod)) mods[++leg] = getMods()
      else mods[leg].other.push(mod)
    }) */

    const mods = matchAll(new RegExp([
      // Capturing mode
      'm', // Move
      'ci', 'c', // Capture enemy piece
      'e', // En passant
      'di', 'd', // Destroy own piece
      'u', // Unload captured piece on starting square of the leg
      'k', // can only capture the King (e.g. any royal pieces)
      't', // Tame (cannot capture royal pieces)
      'x', // eXcite another piece
      'nn', // generate eN passant square

      // Hopping and leaping
      'p', // needs a Platform
      'g', // Grasshop (like p, but land one step behind obstacle)
      'n', // Non-jumping (cannot leap over a piece)
      'j', // Jumping (cannot leap over an empty square)

      // Initial
      'ii', 'i', // must be the Initial move

      // Multi-leg
      'a', // Another move comes after this one
      'y', // Range of the next leg is swapped (Leaper <-> Rider)

      // Directional
      'ff', 'fs', 'fh', 'fl', 'fr', 'f',
      'bb', 'bs', 'bh', 'bl', 'br', 'b',
      'll', 'lv', 'lh', 'lf', 'lb', 'l',
      'rr', 'rv', 'rh', 'rf', 'rb', 'r',
      'v', 's',

      // Chirality
      'hl', 'hr', // Left or right-chiral
      'hq', 'hz', // Same or opposite chirality (only on subsequent legs)

      // Bent pieces
      'q', // cirQlar, bends 45° in the same direction each step (also qq, qqq, etc.)
      'z', // Zig-zag, bends 45° in the other direction each step (also zz, zzz, etc.)
      'oo', 'o' // lOop around to the other side of the board
    ].join('|'), 'gm'), mod)
    moves.push({ target, limit, mods })
  })
  // TODO: parse modifiers.
}
