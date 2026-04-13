const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../japper');
const { NAMES } = require('../../config');

function transformUser(user) {
    if (user.name === 'moviePicker') {
        return;
    }
    const name = NAMES[user.name] ? NAMES[user.name][Math.floor(Math.random() * NAMES[user.name].length)] : user.name;
    const caught = user.caught ?? 0;
    return `${name}: caught ${caught} (${user.yap} yap)`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jap-count')
		.setDescription('Times each person was japped and their current yap streak'),
	async execute(interaction) {

        const japIndex = getDb();
        console.log(japIndex);
        const japCount = Object.values(japIndex).map(transformUser).filter(Boolean);

        interaction.reply(japCount.join('\n'));

        return;
	}
};