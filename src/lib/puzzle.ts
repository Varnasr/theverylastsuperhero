/**
 * Deterministic puzzle generation, run at build time.
 *
 * Everything here is seeded rather than random: the same content must produce
 * the same grid on every build, or a rebuild silently hands readers a different
 * puzzle and any link to "3 across" stops meaning anything.
 */

/** Mulberry32 — small, fast, and identical across runs for a given seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Entry = { answer: string; clue: string };
export type Placed = {
  answer: string;
  clue: string;
  row: number;
  col: number;
  dir: 'across' | 'down';
  number: number;
};
export type Crossword = {
  grid: (string | null)[][];
  numbers: (number | null)[][];
  placed: Placed[];
  rows: number;
  cols: number;
};

const SIZE = 22;

/**
 * Greedy crossing placement. The first word goes in the middle; each later word
 * is tried against every letter already on the board, and the placement with
 * the most crossings wins. Words that will not cross anything are dropped
 * rather than floated free — an island in a crossword is just a word list.
 */
export function buildCrossword(entries: Entry[], seed = 20750614): Crossword {
  const grid: (string | null)[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(null)
  );
  const placed: Placed[] = [];
  const rand = rng(seed);

  // Longest first: long words give later words more letters to hang off.
  const queue = [...entries].sort(
    (a, b) => b.answer.length - a.answer.length || (rand() < 0.5 ? -1 : 1)
  );

  const fits = (word: string, row: number, col: number, dir: 'across' | 'down') => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    if (row < 0 || col < 0) return -1;
    if (row + dr * (word.length - 1) >= SIZE) return -1;
    if (col + dc * (word.length - 1) >= SIZE) return -1;

    // The cells immediately before and after must be empty, or the word runs
    // straight into another and both become nonsense.
    const beforeR = row - dr;
    const beforeC = col - dc;
    const afterR = row + dr * word.length;
    const afterC = col + dc * word.length;
    if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== null) return -1;
    if (afterR < SIZE && afterC < SIZE && grid[afterR][afterC] !== null) return -1;

    let crossings = 0;
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dr * i;
      const c = col + dc * i;
      const cell = grid[r][c];
      if (cell === null) {
        // An empty cell may not have neighbours alongside the run, or the word
        // sits flush against a parallel one and creates unintended words.
        const sideA = dir === 'across' ? [r - 1, c] : [r, c - 1];
        const sideB = dir === 'across' ? [r + 1, c] : [r, c + 1];
        for (const [sr, sc] of [sideA, sideB]) {
          if (sr >= 0 && sr < SIZE && sc >= 0 && sc < SIZE && grid[sr][sc] !== null) return -1;
        }
      } else if (cell === word[i]) {
        crossings += 1;
      } else {
        return -1;
      }
    }
    return crossings;
  };

  const write = (e: Entry, row: number, col: number, dir: 'across' | 'down') => {
    const dr = dir === 'down' ? 1 : 0;
    const dc = dir === 'across' ? 1 : 0;
    for (let i = 0; i < e.answer.length; i += 1) {
      grid[row + dr * i][col + dc * i] = e.answer[i];
    }
    placed.push({ ...e, row, col, dir, number: 0 });
  };

  const first = queue.shift();
  if (!first) return { grid, numbers: [], placed, rows: 0, cols: 0 };
  write(first, Math.floor(SIZE / 2), Math.floor((SIZE - first.answer.length) / 2), 'across');

  for (const entry of queue) {
    let best = { score: -1, row: 0, col: 0, dir: 'across' as 'across' | 'down' };
    for (const anchor of placed) {
      const dir = anchor.dir === 'across' ? 'down' : 'across';
      for (let i = 0; i < anchor.answer.length; i += 1) {
        const ar = anchor.dir === 'down' ? anchor.row + i : anchor.row;
        const ac = anchor.dir === 'across' ? anchor.col + i : anchor.col;
        const letter = anchor.answer[i];
        for (let j = 0; j < entry.answer.length; j += 1) {
          if (entry.answer[j] !== letter) continue;
          const row = dir === 'down' ? ar - j : ar;
          const col = dir === 'across' ? ac - j : ac;
          const score = fits(entry.answer, row, col, dir);
          if (score > best.score) best = { score, row, col, dir };
        }
      }
    }
    if (best.score > 0) write(entry, best.row, best.col, best.dir);
  }

  // Crop to the used area so the rendered grid has no dead margin.
  let minR = SIZE;
  let maxR = -1;
  let minC = SIZE;
  let maxC = -1;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cropped = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => grid[r + minR][c + minC])
  );
  for (const p of placed) {
    p.row -= minR;
    p.col -= minC;
  }

  // Number the squares in reading order, the way a crossword is numbered.
  const numbers: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  let n = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const starts = placed.filter((p) => p.row === r && p.col === c);
      if (starts.length) {
        n += 1;
        numbers[r][c] = n;
        for (const p of starts) p.number = n;
      }
    }
  }

  placed.sort((a, b) => a.number - b.number);
  return { grid: cropped, numbers, placed, rows, cols };
}

export type WordSearch = {
  grid: string[][];
  words: { word: string; row: number; col: number; dr: number; dc: number }[];
  size: number;
};

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];

export function buildWordSearch(words: string[], size = 15, seed = 20750614): WordSearch {
  const rand = rng(seed);
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const out: WordSearch['words'] = [];

  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let done = false;
    for (let attempt = 0; attempt < 400 && !done; attempt += 1) {
      const [dr, dc] = DIRS[Math.floor(rand() * DIRS.length)];
      const row = Math.floor(rand() * size);
      const col = Math.floor(rand() * size);
      const endR = row + dr * (word.length - 1);
      const endC = col + dc * (word.length - 1);
      if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
      let ok = true;
      for (let i = 0; i < word.length && ok; i += 1) {
        const cell = grid[row + dr * i][col + dc * i];
        if (cell !== null && cell !== word[i]) ok = false;
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i += 1) grid[row + dr * i][col + dc * i] = word[i];
      out.push({ word, row, col, dr, dc });
      done = true;
    }
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const filled = grid.map((row) =>
    row.map((cell) => cell ?? letters[Math.floor(rand() * letters.length)])
  );
  return { grid: filled, words: out, size };
}
