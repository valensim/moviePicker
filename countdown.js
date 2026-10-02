const { getDb, getYapNickname } = require("./utils");
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
    return message.mentions.users.some((user) => {
        if (user.username !== username) return false;
        // Reply pings are added to mentions.users without putting <@id> in the message text.
        return new RegExp(`<@!?${user.id}>`).test(message.content);
    });
}

async function timeUntilReply(message, username) {
    const timeUntilReplyDb = getDb(DB_NAMES.TIME_UNTIL_REPLY) || {};
    if (isDirectMention(message, username)) {
        timeUntilReplyDb[username] = new Date();
    }
    else if (message.author.username === username) {
        if (!timeUntilReplyDb[username]) {
            return;
        }
        const timeBetween = await timeBetweenFormated(timeUntilReplyDb[username], new Date());
        const yapNickname = getYapNickname(username);
        await message.reply(`Yep ${yapNickname} is still alive it took just ${timeBetween}.`);
        timeUntilReplyDb[username] = null;
    }
    else {
        return;
    }
    if (Object.keys(timeUntilReplyDb).length === 0) {
        return;
    }
    fs.writeFileSync(DB_NAMES.TIME_UNTIL_REPLY, JSON.stringify(timeUntilReplyDb, null, 2));
    
}

module.exports = { timeBetweenFormated, timeUntilReply, isDirectMention };