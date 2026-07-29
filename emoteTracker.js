const fs = require("fs");
const { getDb } = require("./utils")
const { DB_NAMES } = require("./config");

const CUSTOM_EMOTE_REGEX = /<(a?):(\w+):(\d+)>/g;
const UNICODE_EMOJI_REGEX = /\p{Emoji_Presentation}/gu;


function saveDb(data) {
    fs.writeFileSync(DB_NAMES.EMOTE_INDEX, JSON.stringify(data, null, 2));
}

function increment(db, key, name, isCustom, isAnimated) {
    if (!db[key]) {
        db[key] = { id: key, name, count: 0, isCustom, isAnimated };
    }
    db[key].count++;
}

function trackMessage(message) {
    const content = message.content;
    if (!content) return;

    const db = getDb(DB_NAMES.EMOTE_INDEX);

    for (const match of content.matchAll(CUSTOM_EMOTE_REGEX)) {
        const isAnimated = match[1] === "a";
        const name = match[2];
        const id = match[3];
        increment(db, id, name, true, isAnimated);
    }

    for (const [emoji] of content.matchAll(UNICODE_EMOJI_REGEX)) {
        increment(db, emoji, emoji, false, false);
    }

    saveDb(db);
}

function trackReaction(reaction) {
    const db = getDb(DB_NAMES.EMOTE_INDEX);
    const { emoji } = reaction;

    if (emoji.id) {
        increment(db, emoji.id, emoji.name, true, emoji.animated ?? false);
    } else {
        increment(db, emoji.name, emoji.name, false, false);
    }

    saveDb(db);
}

module.exports = { trackMessage, trackReaction };
