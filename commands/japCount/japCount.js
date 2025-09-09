const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../japper');
const { NAMES } = require('../../config');

function transformUser(user) {
    if (user.name === 'moviePicker') {
        return;
    }
    const name = NAMES[user.name] ? NAMES[user.name][Math.floor(Math.random() * NAMES[user.name].length)] : user.name;
    return `${name}: ${user.yap}`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jap-count')
		.setDescription('returns the number of japs for each person'),
	async execute(interaction) {

        const japIndex = getDb();
        console.log(japIndex);
        const japCount = Object.values(japIndex).map(transformUser);

        interaction.reply(japCount.join('\n'));

        return;
	}
};