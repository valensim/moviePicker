const fs = require("fs")
const { NAMES } = require("./config");

function getDb(dbName) {
    const exist = fs.existsSync(dbName)
    if (!exist) {
        return null
    }
    return JSON.parse(fs.readFileSync(dbName, 'utf8'))
}

function getYapNickname(username) {
    username = username.toLowerCase();
    return NAMES[username] ? NAMES[username][Math.floor(Math.random() * NAMES[username].length)] : username;
}

module.exports = { getDb, getYapNickname }