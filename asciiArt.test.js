const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  fitSize,
  pixelsToAscii,
  imageToAscii,
  normalizeName,
  saveAscii,
  getAscii,
  listAsciiNames,
  formatNameList,
  formatReply,
  DISCORD_MESSAGE_LIMIT,
  MAX_NAME_LENGTH,
} = require("./asciiArt");

function pixels(width, height, paint) {
  const result = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result.push(paint(x, y));
    }
  }
  return result;
}

describe("fitSize", () => {
  it("sizes a square image to the largest grid that fits in one Discord message", () => {
    const { cols, rows } = fitSize(1000, 1000);
    assert.equal(cols, 62);
    assert.equal(rows, 31);
  });

  it("shrinks a tall image by width so the row cap still holds", () => {
    const { cols, rows } = fitSize(500, 4000);
    assert.ok(cols < 62);
    assert.equal(rows, 31);
  });
});

describe("pixelsToAscii", () => {
  it("maps white to a space and black to the darkest character", () => {
    const art = pixelsToAscii(
      [
        { r: 255, g: 255, b: 255, a: 255 },
        { r: 0, g: 0, b: 0, a: 255 },
      ],
      2,
      1,
    );
    assert.equal(art, " @");
  });

  it("treats a transparent pixel as empty", () => {
    const art = pixelsToAscii([{ r: 0, g: 0, b: 0, a: 0 }], 1, 1);
    assert.equal(art, " ");
  });

  it("fills most of one Discord message at the largest allowed grid", () => {
    const { cols, rows } = fitSize(1000, 1000);
    const art = pixelsToAscii(
      pixels(cols, rows, () => ({ r: 0, g: 0, b: 0, a: 255 })),
      cols,
      rows,
    );
    const reply = formatReply("a".repeat(MAX_NAME_LENGTH), art);
    assert.ok(reply.length <= DISCORD_MESSAGE_LIMIT);
    assert.ok(reply.length > 1900);
  });
});

describe("imageToAscii", () => {
  it("turns a black image into dark characters and a white image into spaces", async () => {
    const Jimp = require("jimp");
    const black = await new Jimp(80, 80, 0x000000ff).getBufferAsync(Jimp.MIME_PNG);
    const white = await new Jimp(80, 80, 0xffffffff).getBufferAsync(Jimp.MIME_PNG);

    const blackArt = await imageToAscii(black);
    const whiteArt = await imageToAscii(white);

    assert.match(blackArt, /@/);
    assert.equal(whiteArt.trim(), "");
    assert.ok(formatReply("sample", blackArt).length <= DISCORD_MESSAGE_LIMIT);
  });
});

describe("ascii index", () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ascii-index-"));
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("normalizes names to lowercase hyphenated keys", () => {
    assert.equal(normalizeName("  My Cat  "), "my-cat");
  });

  it("saves art under the normalized name and reads it back", () => {
    const file = path.join(dir, "index.json");
    const saved = saveAscii("My Cat", " @\n@ ", file);
    assert.equal(saved.name, "my-cat");
    assert.equal(saved.replaced, false);
    assert.equal(getAscii("my-cat", file), " @\n@ ");
    const again = saveAscii("my-cat", "@@", file);
    assert.equal(again.replaced, true);
    assert.equal(getAscii("MY CAT", file), "@@");
  });

  it("rejects a name that cannot be used as a key", () => {
    const file = path.join(dir, "bad.json");
    assert.throws(() => saveAscii("!!!", "x", file), /name/i);
  });

  it("rejects art that would not fit in one Discord message", () => {
    const file = path.join(dir, "huge.json");
    const art = "x".repeat(DISCORD_MESSAGE_LIMIT);
    assert.throws(() => saveAscii("big", art, file), /too large/i);
  });

  it("lists saved names in alphabetical order", () => {
    const file = path.join(dir, "list.json");
    saveAscii("zeta", "z", file);
    saveAscii("alpha", "a", file);
    assert.deepEqual(listAsciiNames(file), ["alpha", "zeta"]);
  });

  it("keeps a long name list inside one Discord message", () => {
    const names = Array.from({ length: 200 }, (_, i) => `name-${String(i).padStart(3, "0")}`);
    const reply = formatNameList(names);
    assert.ok(reply.length <= DISCORD_MESSAGE_LIMIT);
    assert.match(reply, /name-000/);
    assert.match(reply, /more/);
  });

  it("says when nothing is saved", () => {
    assert.match(formatNameList([]), /no ascii art saved/i);
  });
});
