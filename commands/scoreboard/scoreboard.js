const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../japper');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription('Shows the highest yap counts before getting japped'),
	async execute(interaction) {
        const scoreboard = getDb();
        
        if (Object.keys(scoreboard).length === 0) {
            await interaction.reply('No high scores yet! Keep yapping to make the scoreboard! 🏆');
            return;
        }

        // Convert to array and sort by high score descending
        const sortedScores = Object.values(scoreboard)
            .filter(user => user.name !== 'moviePicker')
            .sort((a, b) => b.highScore || b.yap - a.highScore || a.yap);

        if (sortedScores.length === 0) {
            await interaction.reply('No high scores yet! Keep yapping to make the scoreboard! 🏆');
            return;
        }

        // Format the scoreboard with medals for top 3
        const medals = ['🥇', '🥈', '🥉'];
        const scoreboardText = sortedScores
            .map((user, index) => {
                const medal = index < 3 ? medals[index] + ' ' : `${index + 1}. `;
                const name = user.name;
                return `${medal}${name}: ${user.highScore || user.yap} yaps`;
            })
            .join('\n');

        await interaction.reply('🏆 **Yap Scoreboard** 🏆\n\n' + scoreboardText);
        return;
	}
};

