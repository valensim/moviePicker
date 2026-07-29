const { getDb } = require("./utils");
const { DB_NAMES } = require("./config");

async function timeBetweenFormated(startDate, endDate) {
    const timeBetween = new Date(endDate).getTime() - new Date(startDate).getTime();
    const days = Math.floor(timeTillDate / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeBetween % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeBetween % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeBetween % (1000 * 60)) / 1000);
    const formatedTime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return formatedTime;
}

async function timeUntilReply(message, username) {
    const timeUntilReplyDb = getDb(DB_NAMES.TIME_UNTIL_REPLY) || {} ;
    if (message.mentions.users.some((user) => user.username === username)){
        timeUntilReplyDb[username] = new Date();
    }
    else if (message.author.username === username) {
        const timeBetween = timeBetweenFormated(timeUntilReplyDb[username], new Date());
        await message.reply(`Yep ${username} is still alive it took just ${timeBetween}.`);
        timeUntilReplyDb[username] = null;
    }
    else {
        return;
    }
    fs.writeFileSync(DB_NAMES.TIME_UNTIL_REPLY, JSON.stringify(timeUntilReplyDb, null, 2));
    
}

module.exports = { timeBetweenFormated, timeUntilReply };