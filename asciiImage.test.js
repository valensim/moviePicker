const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Jimp = require("jimp");
const {
  asciiToPng,
  asciiImageSize,
  drawArt,
  GLYPHS,
  CELL_WIDTH,
  CELL_HEIGHT,
  PADDING,
  INK,
} = require("./asciiImage");

const RAMP = " .:-=+*#%@";

function inkInCell(image, col, row) {
  let count = 0;
  const left = PADDING + col * CELL_WIDTH;
  const top = PADDING + row * CELL_HEIGHT;
  for (let y = top; y < top + CELL_HEIGHT; y++) {
    for (let x = left; x < left + CELL_WIDTH; x++) {
      const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (r === INK[0] && g === INK[1] && b === INK[2]) count++;
    }
  }
  return count;
}

describe("asciiImageSize", () => {
  it("gives every character the same cell, twice as tall as wide", () => {
    assert.equal(CELL_HEIGHT, CELL_WIDTH * 2);
    const size = asciiImageSize("@@@\n@");
    assert.equal(size.cols, 3);
    assert.equal(size.rows, 2);
    assert.equal(size.width, 3 * CELL_WIDTH + PADDING * 2);
    assert.equal(size.height, 2 * CELL_HEIGHT + PADDING * 2);
  });

  it("ignores a trailing newline and Windows line endings", () => {
    assert.deepEqual(asciiImageSize("ab\r\ncd\n"), asciiImageSize("ab\ncd"));
  });

  it("still makes a picture from empty art", () => {
    const size = asciiImageSize("");
    assert.equal(size.cols, 1);
    assert.equal(size.rows, 1);
  });
});

describe("glyphs", () => {
  it("has a glyph for every character the converter can produce", () => {
    for (const char of RAMP) assert.ok(GLYPHS[char], `missing glyph for ${char}`);
  });

  it("gets darker along the ramp, so the picture keeps its shading", () => {
    const ink = Array.from(RAMP, (char) => GLYPHS[char].flat().filter(Boolean).length);
    assert.equal(ink[0], 0);
    for (let i = 1; i < ink.length; i++) {
      assert.ok(ink[i] > ink[i - 1], `${RAMP[i]} should be darker than ${RAMP[i - 1]}`);
    }
  });
});

describe("drawArt", () => {
  it("draws each character in its own cell", () => {
    const image = drawArt(" @\n. ");
    assert.equal(inkInCell(image, 0, 0), 0);
    assert.ok(inkInCell(image, 1, 0) > inkInCell(image, 0, 1));
    assert.ok(inkInCell(image, 0, 1) > 0);
    assert.equal(inkInCell(image, 1, 1), 0);
  });

  it("leaves a blank border around the art", () => {
    const image = drawArt("@");
    const corner = Jimp.intToRGBA(image.getPixelColor(0, 0));
    assert.deepEqual(corner, { r: 255, g: 255, b: 255, a: 255 });
  });

  it("draws an unknown character instead of dropping it", () => {
    const image = drawArt("x");
    assert.ok(inkInCell(image, 0, 0) > 0);
  });
});

describe("asciiToPng", () => {
  it("returns a PNG that is the same size on every screen", async () => {
    const art = Array.from({ length: 31 }, () => "@".repeat(62)).join("\n");
    const png = await asciiToPng(art);
    assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const decoded = await Jimp.read(png);
    const size = asciiImageSize(art);
    assert.equal(decoded.bitmap.width, size.width);
    assert.equal(decoded.bitmap.height, size.height);
    assert.ok(png.length < 8 * 1024 * 1024);
  });
});
