const Jimp = require("jimp");

// Each character is drawn from a small built-in bitmap so the picture looks the
// same on every device and needs no system fonts. A cell is twice as tall as it
// is wide, which matches CHAR_ASPECT in asciiArt.js.
const GLYPH_WIDTH = 6;
const GLYPH_HEIGHT = 12;
const SCALE = 2;
const CELL_WIDTH = GLYPH_WIDTH * SCALE;
const CELL_HEIGHT = GLYPH_HEIGHT * SCALE;
const PADDING = CELL_WIDTH;
const BACKGROUND = [0xff, 0xff, 0xff];
const INK = [0x1e, 0x1f, 0x22];

// "#" marks an inked pixel. Every glyph is GLYPH_WIDTH x GLYPH_HEIGHT.
const GLYPH_ROWS = {
  " ": [
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
  ],
  ".": [
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "......",
    "..##..",
    "..##..",
    "......",
  ],
  ":": [
    "......",
    "......",
    "......",
    "..##..",
    "..##..",
    "......",
    "......",
    "......",
    "..##..",
    "..##..",
    "......",
    "......",
  ],
  "-": [
    "......",
    "......",
    "......",
    "......",
    "......",
    ".####.",
    ".####.",
    ".####.",
    "......",
    "......",
    "......",
    "......",
  ],
  "=": [
    "......",
    "......",
    "......",
    ".####.",
    ".####.",
    "......",
    "......",
    ".####.",
    ".####.",
    "......",
    "......",
    "......",
  ],
  "+": [
    "......",
    "..##..",
    "..##..",
    "..##..",
    "..##..",
    ".####.",
    ".####.",
    "..##..",
    "..##..",
    "..##..",
    "..##..",
    "......",
  ],
  "*": [
    "......",
    "..##..",
    "#.##.#",
    "######",
    ".####.",
    "######",
    "######",
    ".####.",
    "######",
    "#.##.#",
    "..##..",
    "......",
  ],
  "#": [
    "......",
    "##..##",
    "##..##",
    "######",
    "######",
    "##..##",
    "##..##",
    "######",
    "######",
    "##..##",
    "##..##",
    "......",
  ],
  "%": [
    "####.#",
    "###.##",
    "###.##",
    "..###.",
    "..###.",
    ".###..",
    ".###..",
    "###...",
    "##.###",
    "##.###",
    "#..###",
    "#.####",
  ],
  "@": [
    ".####.",
    "######",
    "##..##",
    "#.####",
    "#.####",
    "#.##.#",
    "#.##.#",
    "#.####",
    "#.####",
    "##....",
    "######",
    ".#####",
  ],
};

function parseGlyph(rows) {
  if (rows.length !== GLYPH_HEIGHT || rows.some((row) => row.length !== GLYPH_WIDTH)) {
    throw new Error("Glyph has the wrong size");
  }
  return rows.map((row) => Array.from(row, (cell) => cell === "#"));
}

const GLYPHS = Object.fromEntries(
  Object.entries(GLYPH_ROWS).map(([char, rows]) => [char, parseGlyph(rows)]),
);
// Art saved by hand or by an older version may hold other characters.
const FALLBACK_GLYPH = GLYPHS["#"];

function glyphFor(char) {
  return GLYPHS[char] ?? (char.trim() === "" ? GLYPHS[" "] : FALLBACK_GLYPH);
}

function artLines(art) {
  const lines = String(art).replace(/\r\n?/g, "\n").split("\n");
  while (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function asciiImageSize(art) {
  const lines = artLines(art);
  const cols = Math.max(1, ...lines.map((line) => Array.from(line).length));
  const rows = Math.max(1, lines.length);
  return {
    cols,
    rows,
    width: cols * CELL_WIDTH + PADDING * 2,
    height: rows * CELL_HEIGHT + PADDING * 2,
  };
}

function setPixel(data, width, x, y, [r, g, b]) {
  const i = (y * width + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = 0xff;
}

function drawArt(art) {
  const { width, height } = asciiImageSize(art);
  const image = new Jimp(width, height, Jimp.rgbaToInt(...BACKGROUND, 0xff));
  const { data } = image.bitmap;

  artLines(art).forEach((line, row) => {
    Array.from(line).forEach((char, col) => {
      const glyph = glyphFor(char);
      const left = PADDING + col * CELL_WIDTH;
      const top = PADDING + row * CELL_HEIGHT;
      for (let gy = 0; gy < GLYPH_HEIGHT; gy++) {
        for (let gx = 0; gx < GLYPH_WIDTH; gx++) {
          if (!glyph[gy][gx]) continue;
          for (let sy = 0; sy < SCALE; sy++) {
            for (let sx = 0; sx < SCALE; sx++) {
              setPixel(data, width, left + gx * SCALE + sx, top + gy * SCALE + sy, INK);
            }
          }
        }
      }
    });
  });

  return image;
}

async function asciiToPng(art) {
  return drawArt(art).getBufferAsync(Jimp.MIME_PNG);
}

module.exports = {
  asciiToPng,
  asciiImageSize,
  drawArt,
  GLYPHS,
  CELL_WIDTH,
  CELL_HEIGHT,
  PADDING,
  INK,
  BACKGROUND,
};
