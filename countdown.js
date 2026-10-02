const { getYapNickname } = require("./utils");
const { DB_NAMES } = require("./config");
const fs = require("fs");

async function timeBetweenFormated(startDate, endDate) {
    const timeBetween = new Date(endDate).getTime() - new Date(startDate).getTime();
    const days = Math.floor(timeBetween / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeBetween % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeBetween % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeBetween % (1000 * 60)) / 1000);
    return (`${days}d ${hours}h ${minutes}m ${seconds}s`).toString();
}

function isDirectMention(message, username) {
    // Replies reference another message. Discord then lists that author in mentions,
    // and sometimes also puts <@id> in the text. Neither should start the timer.
    if (message.reference || message.mentions.repliedUser) return false;

    return message.mentions.users.some((user) => {
        if (user.username !== username) return false;
        return new RegExp(`<@!?${user.id}>`).test(message.content);
    });
}

function readDb(dbPath) {
    if (!fs.existsSync(dbPath)) return {};
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(dbPath, db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function withFileLock(lockPath, fn) {
    const deadline = Date.now() + 2000;
    let fd;
    while (!fd) {
        try {
            fd = fs.openSync(lockPath, "wx");
        } catch (error) {
            if (error.code !== "EEXIST") throw error;
            if (Date.now() >= deadline) {
                fs.rmSync(lockPath, { force: true });
            } else {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
            }
        }
    }
    try {
        return fn();
    } finally {
        fs.closeSync(fd);
        fs.rmSync(lockPath, { force: true });
    }
}

function armReplyTimer(dbPath, username, now = new Date()) {
    withFileLock(`${dbPath}.lock`, () => {
        const db = readDb(dbPath);
        db[username] = new Date(now).toISOString();
        writeDb(dbPath, db);
    });
}

function takePendingReply(dbPath, username) {
    return withFileLock(`${dbPath}.lock`, () => {
        const db = readDb(dbPath);
        const startedAt = db[username];
        if (!startedAt) return null;
        delete db[username];
        writeDb(dbPath, db);
        return startedAt;
    });
}

async function timeUntilReply(message, username) {
    const dbPath = DB_NAMES.TIME_UNTIL_REPLY;
    if (isDirectMention(message, username)) {
        armReplyTimer(dbPath, username);
        return;
    }
    if (message.author.username !== username) return;

    const startedAt = takePendingReply(dbPath, username);
    if (!startedAt) return;

    const timeBetween = await timeBetweenFormated(startedAt, new Date());
    const yapNickname = getYapNickname(username);
    await message.reply(`Yep ${yapNickname} is still alive it took just ${timeBetween}.`);
}

module.exports = {
    timeBetweenFormated,
    timeUntilReply,
    isDirectMention,
    armReplyTimer,
    takePendingReply,
};
