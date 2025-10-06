const { SlashCommandBuilder } = require('discord.js');
const { getScoreboardDb } = require('../../japper');
const { NAMES } = require('../../config');

function transformScoreboardEntry(user) {
    if (user.name === 'moviePicker') {
        return null;
    }
    const name = NAMES[user.name] ? NAMES[user.name][Math.floor(Math.random() * NAMES[user.name].length)] : user.name;
    return `${name}: ${user.highScore} yaps`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription('Shows the highest yap counts before getting japped'),
	async execute(interaction) {
        const scoreboard = getScoreboardDb();
        
        if (Object.keys(scoreboard).length === 0) {
            await interaction.reply('No high scores yet! Keep yapping to make the scoreboard! 🏆');
            return;
        }

        // Convert to array and sort by high score descending
        const sortedScores = Object.values(scoreboard)
            .filter(user => user.name !== 'moviePicker')
            .sort((a, b) => b.highScore - a.highScore);

        if (sortedScores.length === 0) {
            await interaction.reply('No high scores yet! Keep yapping to make the scoreboard! 🏆');
            return;
        }

        // Format the scoreboard with medals for top 3
        const medals = ['🥇', '🥈', '🥉'];
        const scoreboardText = sortedScores
            .map((user, index) => {
                const medal = index < 3 ? medals[index] + ' ' : `${index + 1}. `;
                const name = NAMES[user.name.toLowerCase()] ? 
                    NAMES[user.name.toLowerCase()][Math.floor(Math.random() * NAMES[user.name.toLowerCase()].length)] : 
                    user.name;
                return `${medal}${name}: ${user.highScore} yaps`;
            })
            .join('\n');

        await interaction.reply('🏆 **Yap Scoreboard** 🏆\n\n' + scoreboardText);
        return;
	}
};

