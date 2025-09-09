const fs = require("fs")
const { NAMES } = require("./config");
const { ironic } = require('ironicase');
const dbName = './japIndex'

function getDb() {
    const exist = fs.existsSync(dbName)
    if (!exist) {
        return null
    }
    return JSON.parse(fs.readFileSync(dbName))
}

function createDb(message) {
    const users = {};
    message.guild.members.cache.forEach(member => {
        users[member.user.id] = {
            id: member.user.id,
            name: member.user.username,
            yap: 0,
        }
    });
    fs.writeFileSync(dbName, JSON.stringify(users, null, 2))
    return users;
}

async function jap(message) {
    const japIndex = getDb() || createDb(message)
    let user = japIndex[message.author.id]
    if (!user) {
        user = {
            id: message.author.id,
            name: message.author.username,
            yap: 0,
        }
    }
    user.yap++
    const username = user.name.toLowerCase()

    if (Math.random() < user.yap / 1000) {
        const ironicMessage = ironic(message.content);
        const channel = message.channel;

        // Check if the original message was a reply and if the referenced message still exists
        let replyToMessage = null;
        if (message.reference?.messageId) {
            try {
                replyToMessage = await channel.messages.fetch(message.reference.messageId);
            } catch (error) {
                console.log('Referenced message not found, sending as regular message');
            }
        }

        await message.delete();
        const name = NAMES[username] ? NAMES[username][Math.floor(Math.random() * NAMES[username].length)] : username
        const content = name + ' tried to yap: \n' + ironicMessage + '\n' + 'it took ' + user.yap + ' yaps';

        if (replyToMessage) {
            await replyToMessage.reply(content);
        } else {
            await channel.send(content);
        }
        user.yap = 0
    }
    japIndex[user.id] = user
    fs.writeFileSync(dbName, JSON.stringify(japIndex, null, 2))
    return;
}

module.exports = { jap, getDb };