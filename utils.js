const fs = require("fs")

function getDb(dbName) {
    const exist = fs.existsSync(dbName)
    if (!exist) {
        return null
    }
    return JSON.parse(fs.readFileSync(dbName, 'utf8'))
}

module.exports = { getDb }