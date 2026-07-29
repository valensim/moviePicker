const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../utils');
const { DB_NAMES } = require('../../config');
const { getYapNickname } = require('../../utils');

function transformUser(user) {
    if (user.name === 'moviePicker') {
        return;
    }
    const yapNickname = getYapNickname(user.name);
    const caught = user.caught ?? 0;
    return `${yapNickname}: ${user.yap} japů - uvařen ${caught}-krát`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jap-count')
		.setDescription('Times each person was japped and their current yap streak'),
	async execute(interaction) {

        const japIndex = getDb(DB_NAMES.JAP_INDEX) || {};
        const japCount = Object.values(japIndex).map(transformUser).filter(Boolean);

        if (japCount.length === 0) {
            await interaction.reply('No one has been japped yet! Keep yapping to make the scoreboard! 🏆');
            return;
        }

        interaction.reply(japCount.join('\n'));

        return;
	}
};