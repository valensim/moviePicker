const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('presence')
		.setDescription('starts vote on the presence of the members'),
	async execute(interaction) {

        // Find the right channel
        const screening = interaction.guild.channels.cache.find(ch => ch.name === 'screening');

        const today = new Date().toLocaleDateString('cs-CZ'); 
        const messageContent = `@everyone Dorazim na dnesni promitani (${today})`;
        const msg = await screening.send(messageContent);
        interaction.reply('Vote has started');


        // Add reactions for voting
        await msg.react('👍'); // Yes
        await msg.react('👎'); // No
	},
};