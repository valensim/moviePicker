const fs = require("fs");
const Jimp = require("jimp");
const { getDb } = require("./utils");
const { DB_NAMES } = require("./config");

const RAMP = " .:-=+*#%@";
const CHAR_ASPECT = 0.5;
const DISCORD_MESSAGE_LIMIT = 2000;
const MAX_NAME_LENGTH = 32;
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

function normalizeName(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, "-");
}

function replyLength(cols, rows) {
  const artLength = rows * cols + Math.max(0, rows - 1);
  const overhead = formatReply("x".repeat(MAX_NAME_LENGTH), "").length;
  return overhead + artLength;
}

function fitSize(imgW, imgH) {
  if (imgW < 1 || imgH < 1) {
    throw new Error("Image has no pixels");
  }

  const rowsPerCol = (imgH / imgW) * CHAR_ASPECT;
  let best = { cols: 1, rows: 1 };
  for (let cols = 1; cols <= DISCORD_MESSAGE_LIMIT; cols++) {
    const rows = Math.max(1, Math.round(cols * rowsPerCol));
    if (replyLength(cols, rows) > DISCORD_MESSAGE_LIMIT) break;
    best = { cols, rows };
  }
  return best;
}

function charForPixel({ r, g, b, a = 255 }) {
  if (a < 128) return " ";
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const index = Math.round((1 - luminance / 255) * (RAMP.length - 1));
  return RAMP[Math.min(RAMP.length - 1, Math.max(0, index))];
}

function pixelsToAscii(pixelList, width, height) {
  const lines = [];
  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      line += charForPixel(pixelList[y * width + x]);
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function formatReply(name, art) {
  return `**${name}**\n\`\`\`\n${art}\n\`\`\``;
}

async function imageToAscii(buffer) {
  const image = await Jimp.read(buffer);
  const { cols, rows } = fitSize(image.bitmap.width, image.bitmap.height);
  image.resize(cols, rows);

  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const pixelList = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixelList.push(Jimp.intToRGBA(image.getPixelColor(x, y)));
    }
  }

  const art = pixelsToAscii(pixelList, width, height);
  if (formatReply("x".repeat(MAX_NAME_LENGTH), art).length > DISCORD_MESSAGE_LIMIT) {
    throw new Error("ASCII art is too large to send in Discord");
  }
  return art;
}

function readIndex(filePath) {
  const data = getDb(filePath);
  const db = Object.create(null);
  if (!data || typeof data !== "object") return db;

  for (const [key, value] of Object.entries(data)) {
    if (NAME_PATTERN.test(key) && typeof value === "string") {
      db[key] = value;
    }
  }
  return db;
}

function saveAscii(name, art, filePath = DB_NAMES.ASCII_INDEX) {
  const key = normalizeName(name);
  if (!NAME_PATTERN.test(key)) {
    throw new Error("Invalid name");
  }
  if (typeof art !== "string" || formatReply(key, art).length > DISCORD_MESSAGE_LIMIT) {
    throw new Error("ASCII art is too large to send in Discord");
  }

  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error(
      `ASCII index path is missing (got ${filePath}). DB_NAMES=${JSON.stringify(DB_NAMES)}`,
    );
  }

  const db = readIndex(filePath);
  const replaced = Object.prototype.hasOwnProperty.call(db, key);
  db[key] = art;
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  return { name: key, replaced };
}

function getAscii(name, filePath = DB_NAMES.ASCII_INDEX) {
  const key = normalizeName(name);
  const db = readIndex(filePath);
  return db[key] ?? null;
}

function listAsciiNames(filePath = DB_NAMES.ASCII_INDEX) {
  return Object.keys(readIndex(filePath)).sort();
}

function formatNameList(names) {
  if (names.length === 0) {
    return "No ASCII art saved yet. Save one with `/ascii-save`.";
  }

  const header = "Saved ASCII art:";
  const lines = [];
  for (let i = 0; i < names.length; i++) {
    const hiddenAfterThis = names.length - (i + 1);
    const more = hiddenAfterThis > 0 ? `\n…and ${hiddenAfterThis} more` : "";
    const next = `${header}\n${[...lines, `\`${names[i]}\``].join("\n")}${more}`;
    if (next.length > DISCORD_MESSAGE_LIMIT) break;
    lines.push(`\`${names[i]}\``);
  }

  const hidden = names.length - lines.length;
  const more = hidden > 0 ? `\n…and ${hidden} more` : "";
  return `${header}\n${lines.join("\n")}${more}`;
}

module.exports = {
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
  NAME_PATTERN,
};
