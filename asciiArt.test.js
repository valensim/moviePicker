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

  it("makes a portrait photo taller and narrower than a landscape photo", () => {
    const portrait = fitSize(1080, 1920);
    const landscape = fitSize(1920, 1080);

    assert.ok(portrait.rows > landscape.rows);
    assert.ok(portrait.cols < landscape.cols);
    assert.ok(portrait.rows > 31);

    for (const size of [portrait, landscape]) {
      const art = Array.from({ length: size.rows }, () => "x".repeat(size.cols)).join("\n");
      const reply = formatReply("a".repeat(MAX_NAME_LENGTH), art);
      assert.ok(reply.length <= DISCORD_MESSAGE_LIMIT);
    }
  });

  it("lets a very tall image grow down instead of staying short and wide", () => {
    const { cols, rows } = fitSize(500, 4000);
    assert.ok(rows > cols);
    assert.ok(rows > 31);
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

function exifOrientationSegment(orientation) {
  const tiff = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00,
    0x01, 0x00, 0x00, 0x00, orientation, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const header = Buffer.from("Exif\0\0", "binary");
  const body = Buffer.concat([header, tiff]);
  const segment = Buffer.alloc(body.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment.writeUInt16BE(body.length + 2, 2);
  body.copy(segment, 4);
  return segment;
}

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

  it("turns a sideways phone jpeg into a taller picture", async () => {
    const Jimp = require("jimp");
    const wide = await new Jimp(80, 24, 0xffffffff).getBufferAsync(Jimp.MIME_JPEG);
    const sideways = Buffer.concat([
      wide.subarray(0, 2),
      exifOrientationSegment(6),
      wide.subarray(2),
    ]);

    const wideArt = await imageToAscii(wide);
    const uprightArt = await imageToAscii(sideways);
    const wideLines = wideArt.split("\n");
    const uprightLines = uprightArt.split("\n");

    assert.ok(uprightLines.length > wideLines.length);
    assert.ok(uprightLines[0].length < wideLines[0].length);
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
